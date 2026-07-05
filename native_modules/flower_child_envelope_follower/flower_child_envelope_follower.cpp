// soemdsp-native-module: flower_child_envelope_follower
// soemdsp-native-label: Flower Child Envelope Follower
// soemdsp-native-target: flowerChildEnvelopeFollower
// soemdsp-native-kind: envelope
// soemdsp-native-path: Envelope/Follower/Flower Child Envelope Follower
// soemdsp-native-construction: false

namespace {

static const int kMaxInstances = 64;

struct FlowerChildState {
  double currentSlewedValue;
  double holdCounter;
  double out;
  bool active;
};

static FlowerChildState gPool[kMaxInstances];

static inline double safe(double x) { return x * 0.0 == 0.0 ? x : 0.0; }
static inline double clamp(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }
static inline double dabs(double x) { return x < 0.0 ? -x : x; }

static double seconds_to_samples(double seconds, double rate) {
  if (!(seconds > 0.0)) {
    return 1.0;
  }
  const double safeRate = rate < 1.0 ? 1.0 : rate;
  const double samples = seconds * safeRate;
  return samples < 1.0 ? 1.0 : samples;
}

}  // namespace

extern "C" int soemdsp_flower_child_envelope_follower_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      FlowerChildState& s = gPool[i];
      s.currentSlewedValue = 0.0;
      s.holdCounter = 0.0;
      s.out = 0.0;
      s.active = true;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_flower_child_envelope_follower_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" double soemdsp_flower_child_envelope_follower_sample(
  int    handle,
  double input,
  double attack,
  double hold,
  double decay,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  FlowerChildState& s = gPool[handle - 1];

  const double target = clamp(dabs(safe(input)), 0.0, 1.0);
  const double attackSamples = seconds_to_samples(safe(attack), sampleRate);
  const double holdSamples = seconds_to_samples(safe(hold), sampleRate);
  const double decaySamples = seconds_to_samples(safe(decay), sampleRate);
  const double attackStep = 1.0 / attackSamples;
  const double decayStep = 1.0 / decaySamples;
  const double current = clamp(s.currentSlewedValue, 0.0, 1.0);

  if (target >= current) {
    const double next = current + attackStep;
    s.currentSlewedValue = next < target ? next : target;
    s.holdCounter = holdSamples;
  } else if (s.holdCounter > 0.0) {
    s.holdCounter = s.holdCounter - 1.0 > 0.0 ? s.holdCounter - 1.0 : 0.0;
    s.currentSlewedValue = current;
  } else {
    const double next = current - decayStep;
    s.currentSlewedValue = next > target ? next : target;
  }

  s.out = safe(clamp(s.currentSlewedValue, 0.0, 1.0));
  return s.out;
}

extern "C" int soemdsp_flower_child_envelope_follower_version() {
  return 1;
}
