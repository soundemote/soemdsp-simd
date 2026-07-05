// soemdsp-native-module: sample_hold
// soemdsp-native-label: Sample & Hold
// soemdsp-native-target: sampleHold
// soemdsp-native-kind: utility
// soemdsp-native-path: Utility/Sample and Hold/Sample & Hold
// soemdsp-native-construction: false

// The noise-source substitution used when "In" is disconnected is a shared,
// nodeId-seeded PRNG that lives on the JS side (resetSeededState /
// nextSeededBipolar) -- callers resolve that value in JS first and always
// pass a concrete "input" here. This module only owns the hold/trigger state
// machine, which is fully self-contained.

namespace {

static const int kMaxInstances = 64;

struct SampleHoldState {
  double clockPhase;
  double held;
  double lastTrigger;
  bool active;
};

static SampleHoldState gPool[kMaxInstances];

static inline double safe(double x) { return x * 0.0 == 0.0 ? x : 0.0; }

static double dsp_floor(double x) {
  double t = (double)(long long)x;
  return (x < t) ? t - 1.0 : t;
}

}  // namespace

extern "C" int soemdsp_sample_hold_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      SampleHoldState& s = gPool[i];
      s.clockPhase = 0.0;
      s.held = 0.0;
      s.lastTrigger = 0.0;
      s.active = true;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_sample_hold_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" double soemdsp_sample_hold_sample(
  int    handle,
  double input,
  double trigger,
  double threshold,
  double sampleFrequency,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  SampleHoldState& s = gPool[handle - 1];

  const double safeInput = safe(input);
  const double safeTrigger = safe(trigger);
  const double safeThreshold = safe(threshold);
  const double safeFreq = sampleFrequency < 0.0 ? 0.0 : sampleFrequency;
  const double rate = sampleRate < 1.0 ? 44100.0 : sampleRate;

  bool internalFire = false;
  if (safeFreq > 0.0) {
    s.clockPhase += safeFreq / rate;
    if (s.clockPhase >= 1.0) {
      s.clockPhase -= dsp_floor(s.clockPhase);
      internalFire = true;
    }
  }

  if ((s.lastTrigger <= safeThreshold && safeTrigger > safeThreshold) || internalFire) {
    s.held = safeInput;
  }
  s.lastTrigger = safeTrigger;
  return safe(s.held);
}

extern "C" int soemdsp_sample_hold_version() {
  return 1;
}
