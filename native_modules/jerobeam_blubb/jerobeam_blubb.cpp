// soemdsp-native-module: jerobeam_blubb
// soemdsp-native-label: Jerobeam Blubb
// soemdsp-native-target: blubb
// soemdsp-native-kind: jerobeam
//
// Ported from soemdsp/include/soemdsp/oscillator/JerobeamBlubb.{h,cpp}
// (Jerobeam Fenderson's "Blubb" Gen~ patch). The reference getSampleFrame()
// never actually reads its own phasor's value into the `phase` it uses for
// sin/cos, so as written it would emit a frozen DC output forever -- this
// port fixes that (reads phasor.getUnipolarValue() each sample) so the
// circle/square shape actually animates, and treats rotX/rotY as 0..1 turn
// fractions (matching how they're fed into the phase-domain rotate math),
// since the header's own setters pass them through unconverted.

namespace {

static const int kMaxInstances = 16;
static const double kPi = 3.14159265358979323846;
static const double kTau = 6.28318530717958647692;
static const double kHalfPi = 1.57079632679489661923;

struct BlubbState {
  bool active;
  double phase;
  double outX;
  double outY;
};

static BlubbState gPool[kMaxInstances];

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

// soemdsp::oscillator::bipolar::triangle(phase)
double bipolarTriangle(double phase) {
  double p = wrap01(phase);
  return p < 0.5 ? (4.0 * p - 1.0) : (3.0 - 4.0 * p);
}

}  // namespace

extern "C" int soemdsp_jbblubb_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      gPool[i] = BlubbState{};
      gPool[i].active = true;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_jbblubb_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" void soemdsp_jbblubb_reset(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].phase = 0.0;
}

extern "C" void soemdsp_jbblubb_sample(
  int handle,
  double frequency,
  double shape,
  double rotX,
  double rotY,
  double zDepth,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return;
  BlubbState& s = gPool[handle - 1];

  const double safeRate = sampleRate < 1.0 ? 1.0 : sampleRate;
  const double phase = s.phase;

  double chX, chY;
  if (shape >= 0.5) {
    // SQUARE: two triangle waves 90 degrees (a quarter turn) apart.
    chX = bipolarTriangle(phase + 0.125);
    chY = bipolarTriangle(phase + 0.375);
  } else {
    // CIRCLE
    chX = dsp_sin(phase * kTau);
    chY = dsp_cos(phase * kTau);
  }

  // rotate() from the reference: a 2-axis rotation collapsed straight into
  // a zDepth-squished 2D render (it never carries a separate Z channel out).
  const double sinRotX = dsp_sin(rotX * kTau);
  const double cosRotX = dsp_cos(rotX * kTau);
  const double help11 = chX * cosRotX - chY * sinRotX;
  const double help12 = chX * sinRotX + chY * cosRotX;
  const double sinRotY = dsp_sin(rotY * kTau);
  const double cosRotY = dsp_cos(rotY * kTau);
  const double help21 = help11 * cosRotY;
  const double z = help11 * sinRotY;

  const double formula = zDepth * 1.25 * (z * 0.05 + 0.5);
  const double m = 1.0 + zDepth;
  s.outX = (help21 - formula * help21) * m;
  s.outY = (help12 - formula * help12) * m;

  s.phase = wrap01(s.phase + frequency / safeRate);
}

extern "C" double soemdsp_jbblubb_x(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].outX;
}

extern "C" double soemdsp_jbblubb_y(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].outY;
}

extern "C" double soemdsp_jbblubb_version() {
  return 1;
}
