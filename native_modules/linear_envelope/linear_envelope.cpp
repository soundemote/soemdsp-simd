// soemdsp-native-module: linear_envelope
// soemdsp-native-label: Linear Envelope
// soemdsp-native-target: linearEnvelope
// soemdsp-native-kind: envelope
// soemdsp-native-path: Envelope/Linear/Linear Envelope
// soemdsp-native-construction: false

namespace {

static const int kMaxInstances = 64;

enum StageId { kOff = 0, kDelay = 1, kAttack = 2, kDecay = 3, kSustain = 4, kRelease = 5 };

struct LinearEnvState {
  double lastGate;
  double out;
  double releaseDecrement;
  double secondsPassed;
  int stage;
  bool active;
};

static LinearEnvState gPool[kMaxInstances];

static inline double safe(double x) { return x * 0.0 == 0.0 ? x : 0.0; }
static inline double clamp(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }

static void trigger_attack(LinearEnvState& s, double delay, double attack, double rate) {
  const double period = 1.0 / (rate < 1.0 ? 1.0 : rate);
  if (delay < period) {
    if (attack <= period) {
      s.stage = kDecay;
      s.out = 1.0;
    } else {
      s.stage = kAttack;
    }
    return;
  }
  if (s.out <= 0.000001) {
    s.out = 0.0;
    s.secondsPassed = 0.0;
  }
  s.stage = kDelay;
}

}  // namespace

extern "C" int soemdsp_linear_envelope_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      LinearEnvState& s = gPool[i];
      s.lastGate = 0.0;
      s.out = 0.0;
      s.releaseDecrement = 0.0;
      s.secondsPassed = 0.0;
      s.stage = kOff;
      s.active = true;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_linear_envelope_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" double soemdsp_linear_envelope_sample(
  int    handle,
  double gate,
  double delay,
  double attack,
  double decay,
  double sustain,
  double release,
  double level,
  int    looping,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  LinearEnvState& s = gPool[handle - 1];

  const double safeGate = safe(gate);
  const double safeDelay = delay < 0.0 ? 0.0 : delay;
  const double safeAttack = attack < 0.0 ? 0.0 : attack;
  const double safeDecay = decay < 0.0 ? 0.0 : decay;
  const double safeSustain = clamp(sustain, 0.0, 1.0);
  const double safeRelease = release < 0.0 ? 0.0 : release;
  const double safeRate = sampleRate < 1.0 ? 44100.0 : sampleRate;
  const double period = 1.0 / safeRate;

  if (s.lastGate <= 0.0 && safeGate > 0.0) {
    trigger_attack(s, safeDelay, safeAttack, safeRate);
  } else if (s.lastGate > 0.0 && safeGate <= 0.0) {
    s.stage = kRelease;
    const double releaseDenom = safeRelease > period ? safeRelease : period;
    s.releaseDecrement = s.out * period / releaseDenom;
  }
  s.lastGate = safeGate;

  const double attackDenom = safeAttack > period ? safeAttack : period;
  double attackIncrement = period / attackDenom;
  if (attackIncrement > 1.0) attackIncrement = 1.0;
  const double decayDenom = safeDecay > period ? safeDecay : period;
  const double decayDecrement = (1.0 - safeSustain) * period / decayDenom;

  switch (s.stage) {
    case kDelay:
      s.secondsPassed += period;
      if (s.secondsPassed >= safeDelay) {
        s.stage = safeAttack <= period ? kDecay : kAttack;
        s.secondsPassed = 0.0;
        if (safeAttack <= period) {
          s.out = 1.0;
        }
      }
      break;
    case kAttack:
      s.out += attackIncrement;
      if (s.out >= 1.0) {
        s.out = 1.0;
        s.stage = kDecay;
      }
      break;
    case kDecay:
      s.out -= decayDecrement;
      if (s.out <= safeSustain) {
        s.out = safeSustain;
        s.stage = kSustain;
      }
      break;
    case kSustain:
      if (looping) {
        s.stage = kAttack;
      }
      s.out = safeSustain;
      break;
    case kRelease:
      s.out -= s.releaseDecrement;
      if (s.out <= 0.0) {
        s.out = 0.0;
        s.stage = kOff;
        s.secondsPassed = 0.0;
      }
      break;
    case kOff:
    default:
      break;
  }

  return safe(clamp(s.out, 0.0, 1.0) * level);
}

extern "C" int soemdsp_linear_envelope_version() {
  return 1;
}
