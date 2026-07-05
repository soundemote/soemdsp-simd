// soemdsp-native-module: jerobeam_wirdo_spiral
// soemdsp-native-label: Jerobeam WirdoSpiral
// soemdsp-native-target: wirdoSpiral
// soemdsp-native-kind: jerobeam
// soemdsp-native-path: Jerobeam/Spiral/Jerobeam WirdoSpiral
// soemdsp-native-construction: false
//
// Ported from soemdsp/include/soemdsp/oscillator/JerobeamWirdoSpiral.{h,cpp}
// (Jerobeam Fenderson's "WirdoSpiral" Gen~ patch). Two independent 0..1 ramp
// phasors (main + splash) drive a cross-shaped spiral with an optional
// "splash" wobble layered on top.

namespace {

static const int kMaxInstances = 16;
static const double kPi = 3.14159265358979323846;
static const double kTau = 6.28318530717958647692;
static const double kHalfPi = 1.57079632679489661923;

struct WirdoSpiralState {
  bool active;
  double phase;
  double splashPhase;
  double outX;
  double outY;
};

static WirdoSpiralState gPool[kMaxInstances];

double clampd(double v, double lo, double hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

// nostdlib build has no libm to link against -- __builtin_floor/__builtin_trunc
// compile directly to WASM's native f64.floor/f64.trunc instructions.
double wrap01(double v) {
  return v - __builtin_floor(v);
}

double truncToInt(double v) {
  return __builtin_trunc(v);
}

// sin polynomial for u in [0, pi/2], same technique as tb303_filter.cpp.
double poly_sin(double u) {
  const double u2 = u * u;
  return u * (1.0 + u2 * (-1.6666666666666667e-1 + u2 * (8.3333333333333329e-3 + u2 * (-1.9841269841269841e-4 + u2 * (2.7557319223985888e-6 + u2 * (-2.5052108385441720e-8 + u2 * 1.6059043836821614e-10))))));
}

// Full-range sin/cos: reduce to [0, 2*pi) via wrap01, then fold into [0, pi/2].
double dsp_sin(double x) {
  double t = wrap01(x / kTau) * kTau;  // [0, 2*pi)
  bool negate = t > kPi;
  if (negate) t -= kPi;
  double folded = t > kHalfPi ? kPi - t : t;
  double s = poly_sin(folded);
  return negate ? -s : s;
}

double dsp_cos(double x) {
  return dsp_sin(x + kHalfPi);
}

// soemdsp::oscillator::unipolar::trisaw(phase, warp)
double trisaw(double phase, double warp) {
  double safeWarp = clampd(warp, 0.001, 0.999);
  double wrapped = wrap01(phase);
  return wrapped < safeWarp ? wrapped / safeWarp : (1.0 - wrapped) / (1.0 - safeWarp);
}

}  // namespace

extern "C" int soemdsp_jbwirdo_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      gPool[i] = WirdoSpiralState{};
      gPool[i].active = true;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_jbwirdo_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" void soemdsp_jbwirdo_reset(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].phase = 0.0;
  gPool[handle - 1].splashPhase = 0.0;
}

extern "C" void soemdsp_jbwirdo_sample(
  int handle,
  double frequency,
  double sharp,
  double cross,
  double density,
  double length,
  double rotate,
  double splashDepth,
  double splashDensity,
  double cut,
  double scrap,
  double ringCut,
  double splashSpeed,
  double syncCut,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return;
  WirdoSpiralState& s = gPool[handle - 1];

  const double safeRate = sampleRate < 1.0 ? 1.0 : sampleRate;
  const double tri = clampd(sharp, 0.0, 1.0);
  const double dens = density * kTau;
  const double safeScrap = clampd(scrap, 0.0001, 1.0);
  const double safeCut = truncToInt(cut + 0.5);

  double phas = s.phase;
  if (safeCut < 1000.0 && safeCut > 0.0) {
    phas = truncToInt(phas * safeCut) / safeCut;
  }

  const double crossRot = ((phas > tri) ? 1.0 : 0.0) * cross * kTau - cross * kPi;
  double crossPhas = trisaw(phas, tri);
  if (syncCut < 1.0) {
    const double denom = clampd((dens < 0.0 ? -dens : dens) * syncCut, 1.0, 1000.0);
    crossPhas = truncToInt(crossPhas * denom) / denom;
  }
  const double crossbow = crossPhas * length - clampd(length - 1.0, 0.0, 1.0);

  const double crossX = crossbow * dsp_cos(crossRot);
  const double crossY = crossbow * dsp_sin(crossRot);

  const double spirot = crossbow * dens;
  const double spirotX = crossX * dsp_cos(spirot) + crossY * dsp_sin(spirot);
  const double spirotY = crossY * dsp_cos(spirot) - crossX * dsp_sin(spirot);

  double splash = dsp_sin(trisaw(phas * splashDensity + s.splashPhase, 1.0) * kTau * safeScrap);
  if (safeScrap < 0.25) {
    const double denom = dsp_sin(safeScrap * kTau);
    splash = (denom != 0.0) ? splash / denom : 0.0;
  }
  if (safeScrap < 0.5) {
    splash = splash * 2.0 - 1.0;
  } else if (safeScrap < 0.75) {
    const double s2 = dsp_sin(safeScrap * kTau);
    splash = splash * (2.0 + s2) - (s2 + 1.0) * (1.0 + s2);
  }
  if (ringCut < 10.0 && ringCut > 0.0) {
    splash = truncToInt(splash * ringCut) / ringCut;
  }

  s.outX = spirotX;
  s.outY = spirotY * dsp_cos(rotate * kPi * 0.5) + splash * splashDepth;

  s.phase = wrap01(s.phase + frequency / safeRate);
  s.splashPhase = wrap01(s.splashPhase + splashSpeed / safeRate);
}

extern "C" double soemdsp_jbwirdo_x(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].outX;
}

extern "C" double soemdsp_jbwirdo_y(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].outY;
}

extern "C" double soemdsp_jbwirdo_version() {
  return 1;
}
