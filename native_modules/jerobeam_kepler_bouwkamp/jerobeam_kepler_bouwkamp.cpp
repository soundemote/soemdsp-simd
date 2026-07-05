// soemdsp-native-module: jerobeam_kepler_bouwkamp
// soemdsp-native-label: Jerobeam Kepler-Bouwkamp
// soemdsp-native-target: keplerBouwkamp
// soemdsp-native-kind: jerobeam
// soemdsp-native-path: Jerobeam/Orbital Mechanics/Jerobeam Kepler-Bouwkamp
// soemdsp-native-construction: false
//
// Ported from soemdsp/include/soemdsp/oscillator/JerobeamKeplerBouwkamp.{h,cpp}
// (Jerobeam Fenderson's "Kepler-Bouwkamp" Gen~ patch): a nested-polygon
// spiral, cycling from Start to Start+Length-1 sided polygons, each
// interpolated into an inscribed circle. Note: the reference's own phasor
// wraps in a 0..2*pi radian range but is then fed straight into a
// triangle()/trisaw() helper that treats its input as a 0..1 phase -- an
// apparent unit mismatch in the source, replicated here exactly rather than
// "fixed", since this is a faithful port.

namespace {

static const int kMaxInstances = 16;
static const double kPi = 3.14159265358979323846;
static const double kTau = 6.28318530717958647692;
static const double kHalfPi = 1.57079632679489661923;

struct KeplerBouwkampState {
  bool active;
  double phase;  // radians, 0..2*pi (matches the reference's own domain)
  double outX;
  double outY;
};

static KeplerBouwkampState gPool[kMaxInstances];

double clampd(double v, double lo, double hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

double wrap01(double v) {
  return v - __builtin_floor(v);
}

double wrapMod(double v, double modulus) {
  double r = v - __builtin_floor(v / modulus) * modulus;
  return r < 0.0 ? r + modulus : r;
}

double poly_sin(double u) {
  const double u2 = u * u;
  return u * (1.0 + u2 * (-1.6666666666666667e-1 + u2 * (8.3333333333333329e-3 + u2 * (-1.9841269841269841e-4 + u2 * (2.7557319223985888e-6 + u2 * (-2.5052108385441720e-8 + u2 * 1.6059043836821614e-10))))));
}

double dsp_sin(double x) {
  double t = wrap01(x / kTau) * kTau;
  bool negate = t > kPi;
  if (negate) t -= kPi;
  double folded = t > kHalfPi ? kPi - t : t;
  double s = poly_sin(folded);
  return negate ? -s : s;
}

double dsp_cos(double x) {
  return dsp_sin(x + kHalfPi);
}

// soemdsp::math::sincos(): argument is a 0..1 *cycles* value, not radians.
double dsp_sin_cycles(double y) {
  return dsp_sin(y * kTau);
}

double dsp_cos_cycles(double y) {
  return dsp_cos(y * kTau);
}

// trisaw(phase, warp): phase is used AS WRITTEN in the reference -- no
// extra wrap-domain conversion, matching triangle(osc_phase, tri) being
// called directly on the radian-domain osc_phase.
double trisaw(double phase, double warp) {
  double safeWarp = clampd(warp, 0.001, 0.999);
  double wrapped = wrap01(phase);
  return wrapped < safeWarp ? wrapped / safeWarp : (1.0 - wrapped) / (1.0 - safeWarp);
}

}  // namespace

extern "C" int soemdsp_jbkepler_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      gPool[i] = KeplerBouwkampState{};
      gPool[i].active = true;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_jbkepler_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" void soemdsp_jbkepler_reset(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].phase = 0.0;
}

extern "C" void soemdsp_jbkepler_sample(
  int handle,
  double frequency,
  double start,
  double length,
  double circles,
  double zoom,
  double rotation,
  double tri,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return;
  KeplerBouwkampState& s = gPool[handle - 1];

  const double safeRate = sampleRate < 1.0 ? 1.0 : sampleRate;
  const int firstPolygon = (int)clampd(__builtin_trunc(start), 3.0, 20.0);
  const int n = (int)clampd(__builtin_trunc(length), 1.0, 20.0);
  const double circleblend = clampd(circles, 0.0001, 0.9999);

  double waveX = 0.0;
  double waveY = 0.0;

  const double fphas = trisaw(s.phase, tri);
  const double phasXN = fphas * (double)n;
  const double stepPhas = phasXN - __builtin_floor(phasXN);
  const double polygonNumber = phasXN - stepPhas + (double)firstPolygon;

  double polygonPhas = clampd((stepPhas - circleblend) / (1.0 - circleblend), 0.0, 1.0);
  double circlePhas = clampd(stepPhas / circleblend, 0.0, 1.0);
  if (stepPhas > circleblend) {
    circlePhas = 0.0;
  }

  const double radIn = dsp_cos(kPi / polygonNumber);
  double radInPrev = 1.0;
  if (polygonNumber > (double)firstPolygon) {
    int iStart = (int)__builtin_trunc(polygonNumber);
    for (int i = iStart; i > firstPolygon && (iStart - i) < 64; i--) {
      radInPrev *= dsp_cos(kPi / (double)(i - 1));
    }
  }

  double radInNext = 1.0;
  {
    int iStart = (int)__builtin_trunc(polygonNumber);
    int iEnd = firstPolygon + n - 1;
    for (int i = iStart; i < iEnd && (i - iStart) < 64; i++) {
      radInNext *= dsp_cos(kPi / (double)(i + 1));
    }
  }

  int first = 0;
  const double f001 = 0.5 / polygonNumber;
  if (polygonNumber == (double)firstPolygon) {
    first = 1;
  } else if (circlePhas > 1.0 - f001) {
    circlePhas = trisaw((circlePhas - (1.0 - f001)) * 1.0 / f001, 0.5 + 0.5 * circleblend) * f001 + 1.0 - f001;
  }

  if (circlePhas != 0.0) {
    const double f003 = radIn + zoom * (1.0 - radIn);
    const double arg = circlePhas + (first == 0 ? 1.0 : 0.0) * (1.0 - zoom) * 0.5 / (polygonNumber - 1.0) - zoom * (double)first * f001;
    const double f002Sin = dsp_sin_cycles(arg);
    const double f002Cos = dsp_cos_cycles(arg);
    waveX = -f002Sin * f003;
    waveY = f002Cos * f003;
  }
  if (polygonPhas != 0.0) {
    const double shifted = polygonPhas + 1.0 - (1.0 - zoom) * 0.5 / polygonNumber;
    polygonPhas = shifted - __builtin_floor(shifted);
    const double linePhasRaw = polygonPhas * polygonNumber;
    double linePhas = linePhasRaw - __builtin_floor(linePhasRaw);
    const double lineNumber = __builtin_floor(linePhasRaw) + (polygonPhas != 0.0 ? 1.0 : 0.0);

    if (polygonNumber != (double)(firstPolygon + n - 1)
        && lineNumber == polygonNumber
        && linePhas > 0.5 * zoom && linePhas < 0.5 + 0.5 * zoom) {
      linePhas = trisaw((linePhas - 0.5 * zoom) * 2.0, 1.0 - circleblend) / 2.0 + 0.5 * zoom;
    }

    const double line = (linePhas * 2.0 - 1.0) * dsp_sin(kPi / polygonNumber);

    const double arg = lineNumber / polygonNumber;
    const double f1Sin = dsp_sin_cycles(arg);
    const double f1Cos = dsp_cos_cycles(arg);
    waveX = line * f1Cos + radIn * f1Sin;
    waveY = radIn * f1Cos - line * f1Sin;
  }

  const double scale = zoom * radInPrev + (1.0 - zoom) * radInNext;
  waveX *= scale;
  waveY *= scale;

  const double rotArg = rotation * (polygonNumber - (double)firstPolygon);
  const double rotSin = dsp_sin_cycles(rotArg);
  const double rotCos = dsp_cos_cycles(rotArg);

  s.outX = waveX * rotCos + waveY * rotSin;
  s.outY = waveY * rotCos - waveX * rotSin;

  const double phaseInc = kTau * frequency / safeRate;
  s.phase = wrapMod(s.phase + phaseInc, kTau);
}

extern "C" double soemdsp_jbkepler_x(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].outX;
}

extern "C" double soemdsp_jbkepler_y(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].outY;
}

extern "C" double soemdsp_jbkepler_version() {
  return 1;
}
