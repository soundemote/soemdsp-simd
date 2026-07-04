// soemdsp-native-module: pluck_envelope
// soemdsp-native-label: Pluck Envelope
// soemdsp-native-target: pluckEnvelope
// soemdsp-native-kind: envelope

namespace {

static const int kMaxInstances = 64;

enum StageId { kOff = 0, kDelay = 1, kAttack = 2, kDecay = 3, kRelease = 4 };

struct PluckState {
  double autoReleasePhasor;
  double currentValue;
  double decayIncrement;
  double lastRelease;
  double lastTrigger;
  double peak;
  double phasor;
  double releaseIncrement;
  double secondsPassed;
  int stage;
  bool active;
};

static PluckState gPool[kMaxInstances];

static inline double safe(double x) { return x * 0.0 == 0.0 ? x : 0.0; }
static inline double clamp(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }

// exp(x) via x/32 then square 5x -- accurate over a wider range than the
// simpler x/4-square-twice variant used by vactrol_envelope, since pluck's
// feedback coefficients can push x well past -8 (still just a shaping
// coefficient, not precision-critical).
static double dsp_exp(double x) {
  double cx = x < -40.0 ? -40.0 : x;
  double y = cx * (1.0 / 32.0);
  double t = 1.0 + y*(1.0 + y*(0.5 + y*(1.0/6.0 + y*(1.0/24.0 + y*(1.0/120.0 + y*(1.0/720.0 + y/5040.0))))));
  t *= t; t *= t; t *= t; t *= t; t *= t;
  return t;
}

// Fast approximate log2(x) for x > 0 via IEEE-754 double bit manipulation
// (inverse of the fastpow trick used elsewhere in this codebase).
static inline double dsp_log2(double x) {
  if (x <= 0.0) return -1000.0;
  union { double d; int x[2]; } u;
  u.d = x;
  return ((double)(u.x[1]) - 1072632447.0) / 1048576.0;
}

static inline double dsp_log10(double x) {
  return dsp_log2(x) * 0.30102999566398120;
}

static double exponential_curve(double value, double skew) {
  const double safeValue = clamp(value, 0.0, 1.0);
  const double safeSkew = clamp(skew, -0.99, 0.99);
  if (safeSkew == 0.0) {
    return safeValue;
  }
  const double c = 0.5 * (safeSkew + 1.0);
  const double a = 2.0 * dsp_log10((1.0 - c) / c);
  const double denom = 1.0 - dsp_exp(a);
  return denom == 0.0 ? safeValue : (1.0 - dsp_exp(safeValue * a)) / denom;
}

static void pluck_prepare_for_decay(PluckState& s, double rate, double peak) {
  s.phasor = 0.0;
  s.autoReleasePhasor = 0.0;
  s.currentValue = peak;
  s.decayIncrement = (s.currentValue - 1.0) / (rate < 1.0 ? 1.0 : rate) / 50.0;
}

static void pluck_trigger_release(PluckState& s, double rate) {
  if (s.stage != kRelease) {
    s.stage = kRelease;
    s.releaseIncrement = s.currentValue / (rate < 1.0 ? 1.0 : rate) / 50.0;
  }
}

struct PluckParams {
  double attackFeedback;
  double autoReleaseTime;
  double decay;
  double decayModCurve;
  double decayModEnd;
  double decayModFrequency;
  double decayModStart;
  double delayTime;
  double endingDecay;
  double level;
  double releaseFeedback;
  double velocity;
  double velocitySensitivity;
};

static void pluck_trigger_attack(PluckState& s, const PluckParams& p, double rate) {
  const double period = 1.0 / (rate < 1.0 ? 1.0 : rate);
  const double velocity = clamp(p.velocity, 0.0, 1.0);
  const double sensitivity = clamp(p.velocitySensitivity, 0.0, 1.0);
  const double peak = (1.0 - sensitivity) + velocity * sensitivity;
  s.secondsPassed = 0.0;
  s.stage = kDelay;
  if (p.delayTime < period) {
    if (p.attackFeedback <= 1e-8) {
      s.stage = kDecay;
      pluck_prepare_for_decay(s, rate, peak);
    } else {
      s.stage = kAttack;
    }
  }
  s.peak = peak;
}

static double pluck_decay_feedback(PluckState& s, const PluckParams& p) {
  double finalDecayMod = p.endingDecay;
  if (s.phasor < 1.0) {
    const double shaped = exponential_curve(s.phasor, p.decayModCurve == 0.0 ? -1e-8 : p.decayModCurve);
    finalDecayMod = p.decay + p.decayModStart + shaped * (p.decayModEnd - p.decayModStart);
  }
  const double e = dsp_exp(-finalDecayMod * 10.0);
  return e > (1.0 - 1e-6) ? (1.0 - 1e-6) : e;
}

}  // namespace

extern "C" int soemdsp_pluck_envelope_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      PluckState& s = gPool[i];
      s.autoReleasePhasor = 0.0;
      s.currentValue = 0.0;
      s.decayIncrement = 0.0;
      s.lastRelease = 0.0;
      s.lastTrigger = 0.0;
      s.peak = 0.0;
      s.phasor = 0.0;
      s.releaseIncrement = 0.0;
      s.secondsPassed = 0.0;
      s.stage = kOff;
      s.active = true;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_pluck_envelope_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" double soemdsp_pluck_envelope_sample(
  int    handle,
  double trigger,
  double release,
  double attackFeedback,
  double autoReleaseTime,
  double decay,
  double decayModCurve,
  double decayModEnd,
  double decayModFrequency,
  double decayModStart,
  double delayTime,
  double endingDecay,
  double level,
  double releaseFeedback,
  double velocity,
  double velocitySensitivity,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  PluckState& s = gPool[handle - 1];

  const double safeRate = sampleRate < 1.0 ? 44100.0 : sampleRate;
  const double period = 1.0 / safeRate;
  const double safeTrigger = safe(trigger);
  const double safeRelease = safe(release);

  PluckParams p;
  p.attackFeedback = clamp(safe(attackFeedback), 0.0, 1e300);
  p.autoReleaseTime = clamp(safe(autoReleaseTime), 0.0, 1e300);
  p.decay = clamp(safe(decay), 0.1, 1.0);
  p.decayModCurve = clamp(safe(decayModCurve), -1.0, 1.0);
  p.decayModEnd = clamp(safe(decayModEnd), 0.01, 3.0);
  p.decayModFrequency = clamp(safe(decayModFrequency), 0.0, 100.0);
  p.decayModStart = clamp(safe(decayModStart), 0.001, 1.8);
  p.delayTime = clamp(safe(delayTime), 0.0, 1e300);
  p.endingDecay = clamp(safe(endingDecay), 0.0, 1.4);
  p.level = clamp(safe(level), 0.0, 1.0);
  p.releaseFeedback = clamp(safe(releaseFeedback), 0.0, 1.0);
  p.velocity = clamp(safe(velocity), 0.0, 1.0);
  p.velocitySensitivity = clamp(safe(velocitySensitivity), 0.0, 1.0);

  if (s.lastTrigger <= 0.0 && safeTrigger > 0.0) {
    pluck_trigger_attack(s, p, safeRate);
  }
  if (s.lastRelease <= 0.0 && safeRelease > 0.0) {
    pluck_trigger_release(s, safeRate);
  }
  s.lastTrigger = safeTrigger;
  s.lastRelease = safeRelease;

  const double attackFeedbackAmp = 1.0 / ((p.attackFeedback > 1e-8 ? p.attackFeedback : 1e-8) * safeRate);
  double releaseFeedbackAmp = dsp_exp(-p.releaseFeedback * 10.0);
  if (releaseFeedbackAmp > 1.0 - 1e-6) releaseFeedbackAmp = 1.0 - 1e-6;
  const double autoReleaseIncrement = p.autoReleaseTime <= 1e-8
    ? 0.0
    : 1.0 / ((p.autoReleaseTime > 1e-8 ? p.autoReleaseTime : 1e-8) * safeRate);
  const double phasorIncrement = p.decayModFrequency / safeRate;

  switch (s.stage) {
    case kDelay:
      s.secondsPassed += period;
      if (s.secondsPassed >= p.delayTime) {
        s.stage = kAttack;
      }
      break;
    case kAttack:
      s.currentValue += period + s.currentValue * attackFeedbackAmp;
      if (s.currentValue >= s.peak) {
        s.stage = kDecay;
        pluck_prepare_for_decay(s, safeRate, s.peak);
      }
      break;
    case kDecay: {
      const double fb = pluck_decay_feedback(s, p);
      s.currentValue -= s.decayIncrement + s.currentValue * s.currentValue * fb;
      s.phasor += phasorIncrement;
      s.autoReleasePhasor += autoReleaseIncrement;
      if (autoReleaseIncrement > 0.0 && s.autoReleasePhasor >= 1.0) {
        pluck_trigger_release(s, safeRate);
      }
      if (s.currentValue < 0.0) {
        s.currentValue = 0.0;
        s.secondsPassed = 0.0;
        s.phasor = 0.0;
        s.autoReleasePhasor = 0.0;
        s.stage = kOff;
      }
      break;
    }
    case kRelease:
      s.currentValue -= s.releaseIncrement + s.currentValue * s.currentValue * releaseFeedbackAmp;
      if (s.currentValue <= 0.0) {
        s.currentValue = 0.0;
        s.secondsPassed = 0.0;
        s.phasor = 0.0;
        s.autoReleasePhasor = 0.0;
        s.stage = kOff;
      }
      break;
    case kOff:
    default:
      break;
  }

  return safe(s.currentValue * p.level);
}

extern "C" int soemdsp_pluck_envelope_version() {
  return 1;
}
