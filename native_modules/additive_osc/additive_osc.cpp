// soemdsp-native-module: additive_osc
// soemdsp-native-label: Additive Osc
// soemdsp-native-target: additiveOsc
// soemdsp-native-kind: oscillator
// soemdsp-native-path: Oscillator/Additive/Additive Osc
// soemdsp-native-construction: false

// Stateless -- mirrors additiveOscillatorSample in
// public/node-live-audio-worklet.js for the common case where no Damping
// Graph / Phase Graph curve is patched in (dampingGraphValueAt/
// phaseGraphValueAt both collapse to constants: 1 and 0). That is the only
// case this covers, matching the caller's existing hasGraphInput gate --
// when a graph modulator IS connected, the JS path with the real curve
// lookup is still used (a user-editable curve isn't portable math).
//
// Also used natively by gpuAdditiveOsc (soemdsp-native-target duplicated at
// the call site, see node-live-audio-worklet.js) instead of its old
// GPU/WebGL queued-sample precompute path, which was the source of a
// reported distortion bug -- routing through this exact same additive-sum
// code as additiveOsc removes that broken path entirely.

namespace {

static const int kHardMaxHarmonics = 1024;
static const double kTwoPi = 6.28318530717958647693;
static const double kHalfPi = 1.57079632679489661923;

static inline double safe(double x) { return x * 0.0 == 0.0 ? x : 0.0; }
static inline double clamp(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }
static inline double dabs(double x) { return x < 0.0 ? -x : x; }

static double dsp_floor(double x) {
  double t = (double)(long long)x;
  return (x < t) ? t - 1.0 : t;
}

static double wrap_to_pi(double x) {
  return x - kTwoPi * dsp_floor(x / kTwoPi + 0.5);
}

static double dsp_sin(double x) {
  const double r = wrap_to_pi(x);
  const double x2 = r * r;
  const double poly = 1.0 + x2*(-1.0/6.0 + x2*(1.0/120.0 + x2*(-1.0/5040.0 + x2*(1.0/362880.0 + x2*(-1.0/39916800.0)))));
  return r * poly;
}

static double dsp_cos(double x) { return dsp_sin(x + kHalfPi); }

struct Partial { double amplitude; double phase; };

static Partial waveform_harmonic(int waveform, int harmonic, double modA) {
  const int n = harmonic < 1 ? 1 : harmonic;
  const double h = (double)n;
  const double mod = clamp(modA, 0.0, 1.0);
  switch (waveform) {
    case 0: {
      int target = (int)(99.0 * mod + 1.0);
      if (target < 1) target = 1;
      return { n == target ? 1.0 : 0.0, 0.0 };
    }
    case 2:
      return { (n % 2 == 1) ? 1.0 / h : 0.0, mod * 0.5 };
    case 3:
      return { (n % 2 == 1) ? 1.0 / (h * h) : 0.0, (n % 4 == 1) ? 0.0 : 0.5 };
    case 4:
      return { (n % 2 == 1) ? 1.0 / h : (1.0 / h) * (1.0 - mod), 0.0 };
    case 5:
      return { dsp_cos(h * mod * 0.5) / h, 0.0 };
    case 6: {
      const double peak = clamp(mod, 0.001, 0.999);
      return { (dsp_sin(0.5 * h * peak) / (peak * (1.0 - peak) * h * h)) * 0.2, 0.0 };
    }
    case 7: {
      int octaves = (int)(2.0 + mod * 11.0);
      if (octaves < 2) octaves = 2;
      long long target = 1;
      while (target < n) {
        target *= octaves;
      }
      return { (target == n) ? 1.0 / h : 0.0, 0.0 };
    }
    case 1:
    default:
      return { 1.0 / h, (n % 2 == 1) ? 0.5 : 0.0 };
  }
}

}  // namespace

extern "C" double soemdsp_additive_osc_sample(
  double phase,
  double frequency,
  double harmonics,
  double waveform,
  double modA,
  double harmonicPhaseAdd,
  double harmonicPhaseMultiply,
  double level,
  double dampingFilterFrequency,
  double sampleRate
) {
  const double safeRate = sampleRate < 1.0 ? 44100.0 : sampleRate;
  const double safeFrequency = frequency < 0.0 ? 0.0 : frequency;
  int maxHarmonics = (int)(harmonics + 0.5);
  if (maxHarmonics < 1) maxHarmonics = 1;
  if (maxHarmonics > kHardMaxHarmonics) maxHarmonics = kHardMaxHarmonics;
  const int wave = (int)(waveform + 0.5);
  const double mod = clamp(modA, 0.0, 1.0);
  const double phaseAdd = clamp(harmonicPhaseAdd, 0.0, 1.0);
  const double phaseMul = clamp(harmonicPhaseMultiply, 0.0, 4.0);
  const double safeLevel = clamp(level, 0.0, 1.0);
  const double nyquist = safeRate * 0.5;
  const double dampingFreq = clamp(dampingFilterFrequency, 1.0, nyquist < 1.0 ? 1.0 : nyquist);

  const double freqDivisor = safeFrequency < 1.0 ? 1.0 : safeFrequency;
  const double cap = 20000.0 < nyquist * 0.9 ? 20000.0 : nyquist * 0.9;
  int harmonicLimit = (int)(dsp_floor(cap / freqDivisor));
  if (harmonicLimit > maxHarmonics) harmonicLimit = maxHarmonics;
  if (harmonicLimit < 1) harmonicLimit = 1;

  double total = 0.0;
  double norm = 0.0;
  for (int harmonic = 1; harmonic <= harmonicLimit; harmonic++) {
    const Partial partial = waveform_harmonic(wave, harmonic, mod);
    const double dampingX = clamp((safeFrequency * harmonic) / dampingFreq, 0.0, 1.0);
    (void)dampingX;  // dampingGraphValueAt collapses to a constant 1 here (no graph connected)
    const double amplitude = partial.amplitude * 1.0;
    if (amplitude == 0.0) continue;
    const double harmonicRatio = harmonicLimit > 1 ? ((double)(harmonic - 1)) / ((double)(harmonicLimit - 1)) : 0.0;
    (void)harmonicRatio;  // phaseGraphValueAt collapses to a constant 0 here
    const double phaseCurve = 0.0;
    const double phaseMultiplier = 1.0 + phaseCurve * phaseMul;
    const double phaseOffset = partial.phase + phaseCurve * phaseAdd;
    total += dsp_sin((phase * harmonic * phaseMultiplier) + phaseOffset * kTwoPi) * amplitude;
    norm += dabs(amplitude);
  }

  if (norm <= 0.0) {
    return 0.0;
  }
  const double denom = norm * 0.72 > 1.0 ? norm * 0.72 : 1.0;
  return safe(clamp((total / denom) * safeLevel, -1.0, 1.0));
}

extern "C" int soemdsp_additive_osc_version() {
  return 1;
}
