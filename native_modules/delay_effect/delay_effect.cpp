// soemdsp-native-module: delay_effect
// soemdsp-native-label: Delay Effect
// soemdsp-native-target: delayEffect
// soemdsp-native-kind: effect
// soemdsp-native-path: Effect/Delay/Delay Effect
// soemdsp-native-construction: false

// Ported from delayEffectSample in public/node-live-audio-worklet.js: a
// modulated single-tap delay line (mode 0 = normal feedback, mode 1 =
// inverted/"reverse-ish" feedback), LFO-driven read-position wobble via a
// per-sample hashed pseudo-random variation target smoothed toward over
// time (same hashBipolar-style integer hash used elsewhere in this
// codebase, e.g. sabrina_reverb's rnd()).
//
// The JS side's `stableSeed(`${nodeId}:delayVariation`)` FNV-1a hash is
// computed once in the JS wrapper (nodeId is a fixed per-node string) and
// passed in as a plain integer seed -- this module never needs to hash
// strings itself.

namespace {

static const int kMaxInstances = 8;
static const double kMaxDelaySeconds = 4.25;
static const int kMaxBufferSamples = 816002;  // ceil(192000 * 4.25) + 2, worst-case sample rate

struct DelayState {
  bool active;
  float buffer[kMaxBufferSamples];
  int bufferSize;
  double lastWet;
  double lfoPhase;
  double lfoVariationState;
  int position;
};

static DelayState gPool[kMaxInstances];

static inline double safe(double x) { return x * 0.0 == 0.0 ? x : 0.0; }
static inline double clamp(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }
static inline double dabs(double x) { return x < 0.0 ? -x : x; }

static double dsp_floor(double x) {
  double t = (double)(long long)x;
  return (x < t) ? t - 1.0 : t;
}

static double wrap01(double x) {
  double m = x - dsp_floor(x);
  return m < 0.0 ? m + 1.0 : m;
}

static double parabol_sample(double phase) {
  const double wrapped = wrap01(phase);
  return wrapped < 0.5 ? wrapped * 4.0 - 1.0 : 3.0 - wrapped * 4.0;
}

static double hash_bipolar(long long index, unsigned int seed) {
  unsigned int value = (unsigned int)(index ^ (long long)seed);
  value ^= (value >> 16); value *= 2246822507u;
  value ^= (value >> 13); value *= 3266489909u;
  value ^= (value >> 16);
  return ((double)value / 4294967295.0) * 2.0 - 1.0;
}

static double interpolate_linear(const float* buffer, int length, double where) {
  if (length <= 0) return 0.0;
  double wf = dsp_floor(where);
  long long beforeRaw = (long long)wf % length;
  if (beforeRaw < 0) beforeRaw += length;
  const int before = (int)beforeRaw;
  const int after = (before + 1) % length;
  const double mix = where - wf;
  return buffer[before] * (1.0 - mix) + buffer[after] * mix;
}

static void reset_state(DelayState& s) {
  for (int i = 0; i < s.bufferSize; i++) s.buffer[i] = 0.0f;
  s.position = 0;
  s.lfoPhase = 0.0;
  s.lfoVariationState = 0.0;
}

}  // namespace

extern "C" int soemdsp_delay_effect_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      DelayState& s = gPool[i];
      s.active = true;
      s.bufferSize = 1;
      s.buffer[0] = 0.0f;
      s.position = 0;
      s.lastWet = 0.0;
      s.lfoPhase = 0.0;
      s.lfoVariationState = 0.0;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_delay_effect_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

// Returns "Out"; the caller retrieves "Wet" via soemdsp_delay_effect_last_wet
// afterward (matches the create/sample/getter pattern used elsewhere, e.g.
// chua_attractor's x/y/z getters).
extern "C" double soemdsp_delay_effect_sample(
  int    handle,
  double input,
  double time,
  double feedback,
  double mix,
  double level,
  double modAmount,
  double modRate,
  double modVariation,
  double mode,
  double variationSeed,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return safe(input);
  DelayState& s = gPool[handle - 1];

  const double safeRate = sampleRate < 1.0 ? 44100.0 : sampleRate;
  long long requiredSize = (long long)(safeRate * kMaxDelaySeconds) + 1 + 2;
  if (requiredSize < 2) requiredSize = 2;
  if (requiredSize > kMaxBufferSamples) requiredSize = kMaxBufferSamples;
  if (s.bufferSize != (int)requiredSize) {
    s.bufferSize = (int)requiredSize;
    reset_state(s);
  }

  const double dry = safe(input);
  const double timeVal = clamp(safe(time), 0.001, kMaxDelaySeconds);
  const double fb = clamp(safe(feedback), 0.0, 0.95);
  const double mixVal = clamp(safe(mix), 0.0, 1.0);
  const double levelVal = clamp(safe(level), 0.0, 2.0);
  const double modAmountVal = clamp(safe(modAmount), 0.0, 0.5);
  const double modRateVal = clamp(safe(modRate), 0.0, 90.0);
  const double modVariationVal = clamp(safe(modVariation), 0.0, 1.0);
  const int modeVal = (int)(safe(mode) + 0.5) >= 1 ? 1 : 0;
  const unsigned int seed = (unsigned int)(long long)(safe(variationSeed));

  const long long hashIndex = (long long)dsp_floor(s.lfoPhase * 997.0) + s.position;
  const double variationTarget = hash_bipolar(hashIndex, seed);
  const double rateFrac = modRateVal / safeRate;
  s.lfoVariationState += (variationTarget - s.lfoVariationState) * (rateFrac < 1.0 ? rateFrac : 1.0);
  const double variedRate = modRateVal * (1.0 + s.lfoVariationState * modVariationVal);
  const double safeVariedRate = variedRate < 0.0 ? 0.0 : variedRate;
  s.lfoPhase = wrap01(s.lfoPhase + safeVariedRate / safeRate);
  const double lfo = (parabol_sample(s.lfoPhase) + 1.0) * 0.5;

  const double delaySamples = clamp(timeVal * safeRate, 1.0, (double)(s.bufferSize - 2));
  const double bufferOffset = delaySamples - delaySamples * lfo * modAmountVal + 1.0;
  s.position = (s.position + 1) % s.bufferSize;
  double readPosition = (double)s.position + (double)s.bufferSize - bufferOffset;
  readPosition = readPosition - s.bufferSize * dsp_floor(readPosition / s.bufferSize);
  const double wet = interpolate_linear(s.buffer, s.bufferSize, readPosition);
  const double write = modeVal ? ((0.0 - dry) - wet * fb) : (dry + wet * fb);
  s.buffer[s.position] = (float)clamp(write, -8.0, 8.0);
  const double finalWet = modeVal ? (dry * fb - wet * (1.0 - fb * fb)) : wet;
  s.lastWet = safe(finalWet * levelVal);
  return safe((dry * (1.0 - mixVal) + finalWet * mixVal) * levelVal);
}

extern "C" double soemdsp_delay_effect_last_wet(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].lastWet;
}

extern "C" int soemdsp_delay_effect_version() {
  return 1;
}
