// soemdsp-native-module: sine_wavetable
// soemdsp-native-label: SinCos
// soemdsp-native-target: sineWavetable
// soemdsp-native-kind: oscillator
// soemdsp-native-path: Oscillator/Wavetable/SinCos
// soemdsp-native-construction: false

// Stateless -- the JS caller owns the phase accumulator (this.phases, shared
// with the PolyBLEP-family oscillators) and just asks for sin/cos at a given
// phase each sample. Uses a direct trig approximation instead of the JS
// side's 2048-point linear-interpolated wavetable -- strictly more accurate,
// not a behavior change worth flagging.

namespace {

static const double kTwoPi = 6.28318530717958647693;
static const double kPi = 3.14159265358979323846;
static const double kHalfPi = 1.57079632679489661923;

static inline double safe(double x) { return x * 0.0 == 0.0 ? x : 0.0; }
static inline double clamp(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }

static double dsp_floor(double x) {
  double t = (double)(long long)x;
  return (x < t) ? t - 1.0 : t;
}

// Range-reduce to (-pi, pi], then Taylor series (same technique used by
// cookbook_filter's dsp_sin/dsp_cos, extended with a wrap step since phase
// here is unbounded rather than pre-clamped to one cycle).
static double wrap_to_pi(double x) {
  return x - kTwoPi * dsp_floor(x / kTwoPi + 0.5);
}

static double dsp_sin(double x) {
  const double r = wrap_to_pi(x);
  const double x2 = r * r;
  const double poly = 1.0 + x2*(-1.0/6.0 + x2*(1.0/120.0 + x2*(-1.0/5040.0 + x2*(1.0/362880.0 + x2*(-1.0/39916800.0)))));
  return r * poly;
}

static double dsp_cos(double x) {
  return dsp_sin(x + kHalfPi);
}

static double nyquist_fade_amplitude(double frequency, double sampleRate) {
  const double safeRate = sampleRate < 1.0 ? 44100.0 : sampleRate;
  const double nyquist = safeRate * 0.5;
  const double safeFrequency = frequency < 0.0 ? 0.0 : frequency;
  const double fadeStart = 20000.0 < nyquist * 0.9 ? 20000.0 : nyquist * 0.9;
  if (safeFrequency <= fadeStart) return 1.0;
  if (safeFrequency >= nyquist) return 0.0;
  double t = (safeFrequency - fadeStart) / (nyquist - fadeStart > 1.0 ? nyquist - fadeStart : 1.0);
  t = clamp(t, 0.0, 1.0);
  const double smooth = t * t * (3.0 - 2.0 * t);
  return 1.0 - smooth;
}

}  // namespace

extern "C" double soemdsp_sine_wavetable_sin(
  double phaseRadians,
  double frequency,
  double amplitude,
  double sampleRate
) {
  const double level = (amplitude < 0.0 ? 0.0 : amplitude) * nyquist_fade_amplitude(frequency, sampleRate);
  return safe(dsp_sin(phaseRadians) * level);
}

extern "C" double soemdsp_sine_wavetable_cos(
  double phaseRadians,
  double frequency,
  double amplitude,
  double sampleRate
) {
  const double level = (amplitude < 0.0 ? 0.0 : amplitude) * nyquist_fade_amplitude(frequency, sampleRate);
  return safe(dsp_sin(phaseRadians + kHalfPi) * level);
}

extern "C" int soemdsp_sine_wavetable_version() {
  return 1;
}
