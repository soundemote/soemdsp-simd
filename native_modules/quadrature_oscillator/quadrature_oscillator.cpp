// soemdsp-native-module: quadrature_oscillator
// soemdsp-native-label: Quadrature Oscillator
// soemdsp-native-target: quadratureOscillator
// soemdsp-native-kind: oscillator
// soemdsp-native-path: Oscillator/Quadrature/Quadrature Oscillator
// soemdsp-native-construction: false
//
// "The only equation we need to run an entire universe": the coupled-form
// ("magic circle") two-multiply recurrence, from the musicdsp.org fast
// sine/cosine calculation family --
//
//   u[n] = u[n-1] - k*v[n-1]
//   v[n] = v[n-1] + k*u[n]
//
// -- with k = 2*sin(w/2), w = 2*pi*freq/sampleRate. Unlike the plain
// single-recurrence sine generator (y0 = 2*cos(w)*y1 - y2), this form:
//   1. Produces sin AND cos every sample from one shared state (u,v) --
//      no separate oscillator needed when a module wants both.
//   2. Has a known instantaneous radius (r^2 = u^2 + v^2) every sample, so
//      floating-point amplitude drift (inherent to any such recurrence) is
//      correctable with one cheap renormalization each tick, rather than
//      needing separate drift-detection bookkeeping.
//   3. Re-derives its coefficient (k) from the current frequency every
//      sample rather than needing two sin()-derived history samples
//      reinitialized on every frequency change -- so frequency modulation
//      (pitch input, macro controls, FM) is just a coefficient swap, not a
//      phase-continuity recomputation.

namespace {

constexpr double kPi = 3.1415926535897932384626433832795;
constexpr double kTwoPi = kPi * 2.0;

double clampD(double value, double lo, double hi) {
  return value < lo ? lo : (value > hi ? hi : value);
}

double wrapRadians(double value) {
  return value - kTwoPi * __builtin_floor(value / kTwoPi + 0.5);
}

// Used only at (re)initialization/reset -- the per-sample hot path never
// calls this, it just runs the two-multiply recurrence above.
double sinApprox(double value) {
  const double x = wrapRadians(value);
  const double x2 = x * x;
  double result = -1.0 / 39916800.0;
  result = 1.0 / 362880.0 + x2 * result;
  result = -1.0 / 5040.0 + x2 * result;
  result = 1.0 / 120.0 + x2 * result;
  result = -1.0 / 6.0 + x2 * result;
  result = 1.0 + x2 * result;
  return x * result;
}

double cosApprox(double value) {
  return sinApprox(value + kPi * 0.5);
}

constexpr int kMaxInstances = 16;

struct QuadratureOscillatorState {
  bool active;
  double u;         // cos-phase state
  double v;         // sin-phase state
  double lastReset;
  double sinOut;
  double cosOut;
};

static QuadratureOscillatorState gPool[kMaxInstances];

void reinitPhase(QuadratureOscillatorState& s, double phaseCycles) {
  const double angle = phaseCycles * kTwoPi;
  s.u = cosApprox(angle);
  s.v = sinApprox(angle);
}

}  // namespace

extern "C" int soemdsp_quadrature_oscillator_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      gPool[i] = QuadratureOscillatorState{};
      gPool[i].active = true;
      gPool[i].u = 1.0;
      gPool[i].v = 0.0;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_quadrature_oscillator_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" void soemdsp_quadrature_oscillator_reset(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  QuadratureOscillatorState& s = gPool[handle - 1];
  s.u = 1.0;
  s.v = 0.0;
  s.lastReset = 0.0;
  s.sinOut = 0.0;
  s.cosOut = 1.0;
}

// resetGate: >0.5 on its rising edge reinitializes phase to phaseCycles.
// phaseCycles: 0..1, the phase to (re)initialize to on reset.
// freqHz: oscillation frequency.
// amplitude: output scale for both sin and cos outputs.
extern "C" void soemdsp_quadrature_oscillator_sample(
  int handle,
  double resetGate,
  double phaseCycles,
  double freqHz,
  double sampleRate,
  double amplitude
) {
  if (handle < 1 || handle > kMaxInstances) return;
  QuadratureOscillatorState& s = gPool[handle - 1];

  if (resetGate > 0.5 && s.lastReset <= 0.0) {
    reinitPhase(s, phaseCycles);
  }
  s.lastReset = resetGate;

  const double safeSampleRate = sampleRate > 1.0 ? sampleRate : 48000.0;
  const double w = kTwoPi * freqHz / safeSampleRate;
  const double k = 2.0 * sinApprox(w * 0.5);

  const double nextU = s.u - k * s.v;
  const double nextV = s.v + k * nextU;

  // Instantaneous radius is always known for this form (r^2 = u^2 + v^2),
  // so drift correction is a single cheap rescale -- no separate amplitude
  // tracking needed, unlike the plain single-recurrence sine generator.
  const double r2 = nextU * nextU + nextV * nextV;
  double correctedU = nextU;
  double correctedV = nextV;
  if (r2 > 1.0e-12 && (r2 < 0.999 || r2 > 1.001)) {
    const double scale = 1.0 / __builtin_sqrt(r2);
    correctedU = nextU * scale;
    correctedV = nextV * scale;
  }

  s.u = correctedU;
  s.v = correctedV;

  const bool finite = (correctedU * 0.0 == 0.0) && (correctedV * 0.0 == 0.0);
  if (!finite) {
    reinitPhase(s, phaseCycles);
  }

  s.cosOut = clampD(s.u, -1.5, 1.5) * amplitude;
  s.sinOut = clampD(s.v, -1.5, 1.5) * amplitude;
}

extern "C" double soemdsp_quadrature_oscillator_sin(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].sinOut;
}

extern "C" double soemdsp_quadrature_oscillator_cos(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].cosOut;
}

extern "C" int soemdsp_quadrature_oscillator_version() {
  return 1;
}
