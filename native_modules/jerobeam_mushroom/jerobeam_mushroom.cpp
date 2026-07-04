// soemdsp-native-module: jerobeam_mushroom
// soemdsp-native-label: Jerobeam Mushroom
// soemdsp-native-target: mushroom
// soemdsp-native-kind: jerobeam
//
// Ported from soemdsp/include/soemdsp/oscillator/JerobeamMushroom.{h,cpp}
// (Jerobeam Fenderson's "Mushroom" Gen~ patch). Three independent phasors
// (main, cap/stem rotator, cluster rotator) drive a cap/stem-blended
// mushroom-cross-section shape. `RAPT::rsRotationXYZ` is included by the
// reference header but never actually called in getSampleFrame(), so it's
// not part of this port either.

namespace {

static const int kMaxInstances = 16;
static const double kPi = 3.14159265358979323846;
static const double kTau = 6.28318530717958647692;
static const double kHalfPi = 1.57079632679489661923;

struct MushroomState {
  bool active;
  double phase;
  double capRotRamp;
  double clusterRotRamp;
  double outX;
  double outY;
};

static MushroomState gPool[kMaxInstances];

double clampd(double v, double lo, double hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

double wrap01(double v) {
  return v - __builtin_floor(v);
}

double poly_sin(double u) {
  const double u2 = u * u;
  return u * (1.0 + u2 * (-1.6666666666666667e-1 + u2 * (8.3333333333333329e-3 + u2 * (-1.9841269841269841e-4 + u2 * (2.7557319223985888e-6 + u2 * (-2.5052108385441720e-8 + u2 * 1.6059043836821614e-10))))));
}

// Standard library sin()/cos(): argument already in radians.
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

// soemdsp::math::sincos(): argument is a 0..1 *cycles* value, not radians
// (SineWavetable::sincos wraps to [0,1) then indexes a one-cycle table).
double dsp_sin_cycles(double y) {
  return dsp_sin(y * kTau);
}

double dsp_cos_cycles(double y) {
  return dsp_cos(y * kTau);
}

// soemdsp::utility::gen::triangle(x, y) == trisaw(wrap(x), y)
double trisaw(double phase, double warp) {
  double safeWarp = clampd(warp, 0.001, 0.999);
  double wrapped = wrap01(phase);
  return wrapped < safeWarp ? wrapped / safeWarp : (1.0 - wrapped) / (1.0 - safeWarp);
}

}  // namespace

extern "C" int soemdsp_jbmushroom_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      gPool[i] = MushroomState{};
      gPool[i].active = true;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_jbmushroom_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" void soemdsp_jbmushroom_reset(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].phase = 0.0;
  gPool[handle - 1].capRotRamp = 0.0;
  gPool[handle - 1].clusterRotRamp = 0.0;
}

extern "C" void soemdsp_jbmushroom_sample(
  int handle,
  double frequency,
  double phaseOffset,
  double numMushrooms,
  double grow,
  double density,
  double capRotation,
  double stemRotationSpeed,
  double head,
  double spread,
  double wobble,
  double clusterRotation,
  double clusterRotationSpeed,
  double sharp,
  double width,
  double stem,
  double apart,
  double capStemTransition,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return;
  MushroomState& s = gPool[handle - 1];

  const double safeRate = sampleRate < 1.0 ? 1.0 : sampleRate;
  const double nom = numMushrooms < -5.0 ? -5.0 : (numMushrooms > 5.0 ? 5.0 : (numMushrooms == 0.0 ? 1.0 : __builtin_trunc(numMushrooms)));
  const double phasorFreq = nom < 0.0 ? (frequency / nom * 0.5) : (frequency * 0.5);
  const double safeSharp = sharp * 0.5 + 0.5;
  const double safeSpread = spread * 4.0;

  const double phas = wrap01(s.phase + phaseOffset * 0.5);
  const double caprot = wrap01(s.capRotRamp + capRotation);
  const double stemrot = wrap01(s.clusterRotRamp + clusterRotation);

  const double phasXNomX2 = phas * nom * 2.0;
  const double ph = trisaw(phasXNomX2, safeSharp) * grow;
  const double stair = __builtin_floor(phasXNomX2) / nom;
  const double phuk = wrap01(ph * wobble + stair);

  const double formulaSin = dsp_sin_cycles((ph - caprot) * density);
  const double formulaCos = dsp_cos_cycles((ph - caprot) * density);

  double shroomX = formulaSin * width;
  double shroomY = -formulaCos * width;

  const double sinPhTau = dsp_sin(ph * kTau);
  const double shroomHeadX = shroomX * sinPhTau * 0.5;
  const double densClamped = clampd(density, 0.0, 10.0);
  const double shroomHeadY = shroomY * 0.1 * sinPhTau * densClamped / 10.0;

  const double shroomStemX = shroomX * -0.4 * stem;
  const double shroomStemY = shroomY * -0.1 * stem;

  if (ph > head) {
    shroomX = shroomHeadX;
    shroomY = shroomHeadY;
  } else if (ph > (1.0 - capStemTransition) * head) {
    const double oneMTransXHead = (1.0 - capStemTransition) * head;
    const double formula2 = (ph - oneMTransXHead) / (head - oneMTransXHead);
    shroomX = shroomHeadX * formula2 + shroomStemX * (1.0 - formula2);
    shroomY = shroomHeadY * formula2 + shroomStemY * (1.0 - formula2);
  } else {
    shroomX = shroomStemX;
    shroomY = shroomStemY;
  }

  shroomX += ph * dsp_cos((phuk + stemrot - 0.25) * kTau) * 0.5 * safeSpread;
  shroomY += ph * 2.0 - 1.0;

  const double dual = ((phas >= 0.5 ? 1.0 : 0.0) * 2.0 - 1.0) * apart;
  shroomX += shroomX + dual;

  if (nom > 0.0) {
    shroomX = -shroomX;
  }

  s.outX = shroomX;
  s.outY = shroomY;

  s.phase = wrap01(s.phase + phasorFreq / safeRate);
  s.capRotRamp = wrap01(s.capRotRamp + stemRotationSpeed / safeRate);
  s.clusterRotRamp = wrap01(s.clusterRotRamp + clusterRotationSpeed / safeRate);
}

extern "C" double soemdsp_jbmushroom_x(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].outX;
}

extern "C" double soemdsp_jbmushroom_y(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].outY;
}

extern "C" double soemdsp_jbmushroom_version() {
  return 1;
}
