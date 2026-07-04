// soemdsp-native-module: random_walk
// soemdsp-native-label: Random Walk
// soemdsp-native-target: randomWalk
// soemdsp-native-kind: generator

// Ported from randomWalkSample in public/node-live-audio-worklet.js. The
// per-node seed hash (stableSeed(seededKey(nodeId, params.seed, "randomWalk")))
// is still computed in JS -- that's a one-time FNV-1a hash of a small string,
// not per-sample work -- and passed in as `seedHash`; this module re-seeds
// its internal LCG whenever seedHash changes, matching resetSeededState's
// reset-on-key-change behavior exactly (reseed AND zero out/lowpass state).

namespace {

static const int kMaxInstances = 32;

struct RandomWalkState {
  bool active;
  bool hasSeed;
  double lowpassOut;
  double out;
  unsigned int seed;
  unsigned int seedHash;
};

static RandomWalkState gPool[kMaxInstances];

static inline double safe(double x) { return x * 0.0 == 0.0 ? x : 0.0; }
static inline double clamp(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }

// exp(x) via x/32 then square 5x -- same wide-range approximation used by
// pluck_envelope, accurate enough for a one-pole filter coefficient.
static double dsp_exp(double x) {
  double cx = x < -40.0 ? -40.0 : x;
  double y = cx * (1.0 / 32.0);
  double t = 1.0 + y*(1.0 + y*(0.5 + y*(1.0/6.0 + y*(1.0/24.0 + y*(1.0/120.0 + y*(1.0/720.0 + y/5040.0))))));
  t *= t; t *= t; t *= t; t *= t; t *= t;
  return t;
}

static double next_seeded_unipolar(RandomWalkState& s) {
  s.seed = (unsigned int)(1664525u * s.seed + 1013904223u);
  return (double)s.seed / 4294967295.0;
}

static double next_seeded_bipolar(RandomWalkState& s) {
  return next_seeded_unipolar(s) * 2.0 - 1.0;
}

static double rational_curve(double value, double skew) {
  const double t = clamp(value, 0.0, 1.0);
  const double safeSkew = clamp(skew, -0.999, 0.999);
  return ((1.0 + safeSkew) * t) / (1.0 - safeSkew + 2.0 * safeSkew * t);
}

static double one_pole_lowpass(RandomWalkState& s, double input, double frequency, double rate) {
  const double safeInput = safe(input);
  const double freq = frequency < 0.0 ? 0.0 : frequency;
  double w = (6.28318530717958647693 / rate);
  if (w > 0.000142475857) w = 0.000142475857;
  w *= freq;
  const double a1 = dsp_exp(-w);
  const double b0 = 1.0 - a1;
  s.lowpassOut = safe(b0 * safeInput + a1 * s.lowpassOut);
  return s.lowpassOut;
}

}  // namespace

extern "C" int soemdsp_random_walk_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      RandomWalkState& s = gPool[i];
      s.active = true;
      s.hasSeed = false;
      s.lowpassOut = 0.0;
      s.out = 0.0;
      s.seed = 0x12345678u;
      s.seedHash = 0;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_random_walk_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" double soemdsp_random_walk_sample(
  int    handle,
  double method,
  double frequency,
  double jitter,
  double level,
  double seedHash,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  RandomWalkState& s = gPool[handle - 1];

  const unsigned int hash = (unsigned int)(long long)seedHash;
  if (!s.hasSeed || s.seedHash != hash) {
    s.hasSeed = true;
    s.seedHash = hash;
    s.seed = hash;
    s.out = 0.0;
    s.lowpassOut = 0.0;
  }

  const double safeRate = sampleRate < 1.0 ? 44100.0 : sampleRate;
  int methodVal = (int)(method + 0.5);
  if (methodVal < 0) methodVal = 0;
  if (methodVal > 3) methodVal = 3;
  const double safeFrequency = frequency < 0.0 ? 0.0 : frequency;
  const double safeJitter = jitter < 0.0 ? 0.0 : jitter;
  const double safeLevel = safe(level);

  const double noise = next_seeded_bipolar(s);
  const double increment = clamp(safeFrequency / safeRate, 0.0, 1.0);
  const double jitterInc = clamp(safeJitter / safeRate, 0.0, 1.0);
  const double stepSize = clamp(increment + rational_curve(jitterInc, 0.99), 0.0, 1.0);
  const double averageIncrement = (jitterInc + increment) * 0.5;
  const double whiteNoiseMix = averageIncrement >= 0.9
    ? rational_curve((averageIncrement - 0.9) / 0.1, -0.7)
    : 0.0;
  const double randomMix = 1.0 - whiteNoiseMix;

  if (methodVal == 0) {
    return safe(noise * safeLevel);
  }
  if (methodVal == 1) {
    return one_pole_lowpass(s, noise, safeFrequency, safeRate) * safeLevel;
  }
  const double step = methodVal == 3 ? (noise > 0.0 ? stepSize : -stepSize) : noise * stepSize;
  s.out = clamp(s.out + step, -1.0, 1.0);
  const double mixed = s.out * randomMix + noise * whiteNoiseMix;
  return safe(one_pole_lowpass(s, mixed, safeFrequency, safeRate) * safeLevel);
}

extern "C" int soemdsp_random_walk_version() {
  return 1;
}
