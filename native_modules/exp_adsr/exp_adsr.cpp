// soemdsp-native-module: exp_adsr
// soemdsp-native-label: Exp ADSR
// soemdsp-native-target: expAdsr
// soemdsp-native-kind: envelope

namespace {

static const int kMaxInstances = 64;

enum StageId { kOff = 0, kDelay = 1, kAttack = 2, kDecay = 3, kSustain = 4, kRelease = 5 };

struct ExpAdsrState {
  double lastGate;
  double out;
  double secondsPassed;
  int stage;
  bool active;
};

static ExpAdsrState gPool[kMaxInstances];

static inline double safe(double x) { return x * 0.0 == 0.0 ? x : 0.0; }
static inline double clamp(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }

// Same fast approximate pow(base, exponent) used by vactrol_envelope: good to
// within a few percent, which matches this codebase's established tolerance
// for envelope-shape coefficients (not precision-critical DSP).
static inline double dsp_pow(double base, double exponent) {
  if (base <= 0.0) return 0.0;
  union { double d; int x[2]; } u;
  u.d = base;
  u.x[1] = (int)(exponent * (double)(u.x[1] - 1072632447) + 1072632447.0);
  u.x[0] = 0;
  return u.d;
}

static double calc_coef(double rate, double targetRatio) {
  const double safeRate = rate < 0.0 ? 0.0 : rate;
  const double safeRatio = targetRatio < 0.000000001 ? 0.000000001 : targetRatio;
  if (safeRate <= 0.0) return 0.0;
  // exp(-log((1+ratio)/ratio) / rate) == ((1+ratio)/ratio) ^ (-1/rate)
  return dsp_pow((1.0 + safeRatio) / safeRatio, -1.0 / safeRate);
}

static void trigger_attack(ExpAdsrState& s, double delay, double attack, double rate) {
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

extern "C" int soemdsp_exp_adsr_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      ExpAdsrState& s = gPool[i];
      s.lastGate = 0.0;
      s.out = 0.0;
      s.secondsPassed = 0.0;
      s.stage = kOff;
      s.active = true;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_exp_adsr_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" double soemdsp_exp_adsr_sample(
  int    handle,
  double gate,
  double delay,
  double attack,
  double decay,
  double sustain,
  double release,
  double attackShape,
  double releaseShape,
  double level,
  int    looping,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  ExpAdsrState& s = gPool[handle - 1];

  const double safeGate = safe(gate);
  const double safeDelay = delay < 0.0 ? 0.0 : delay;
  const double safeAttack = attack < 0.0 ? 0.0 : attack;
  const double safeDecay = decay < 0.0 ? 0.0 : decay;
  const double safeSustain = clamp(sustain, 0.0, 1.0);
  const double safeRelease = release < 0.0 ? 0.0 : release;
  const double safeAttackShape = attackShape < 0.000000001 ? 0.000000001 : attackShape;
  const double safeReleaseShape = releaseShape < 0.000000001 ? 0.000000001 : releaseShape;
  const double safeRate = sampleRate < 1.0 ? (44100.0 < 1.0 ? 1.0 : 44100.0) : sampleRate;
  const double period = 1.0 / safeRate;

  if (s.lastGate <= 0.0 && safeGate > 0.0) {
    trigger_attack(s, safeDelay, safeAttack, safeRate);
  } else if (s.lastGate > 0.0 && safeGate <= 0.0) {
    s.stage = kRelease;
  }
  s.lastGate = safeGate;

  const double attackCoef = calc_coef(safeAttack * safeRate, safeAttackShape);
  const double decayCoef = calc_coef(safeDecay * safeRate, safeReleaseShape);
  const double releaseCoef = calc_coef(safeRelease * safeRate, safeReleaseShape);
  const double attackBase = (1.0 + safeAttackShape) * (1.0 - attackCoef);
  const double decayBase = (safeSustain - safeReleaseShape) * (1.0 - decayCoef);
  const double releaseBase = -safeReleaseShape * (1.0 - releaseCoef);

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
      s.out = attackBase + s.out * attackCoef;
      if (s.out >= 1.0) {
        s.out = 1.0;
        s.stage = kDecay;
      }
      break;
    case kDecay:
      s.out = decayBase + s.out * decayCoef;
      if (s.out <= safeSustain) {
        s.out = safeSustain;
        s.stage = kSustain;
      }
      break;
    case kSustain:
      s.out = safeSustain;
      if (looping) {
        trigger_attack(s, safeDelay, safeAttack, safeRate);
      }
      break;
    case kRelease:
      s.out = releaseBase + s.out * releaseCoef;
      if (s.out <= 0.0) {
        s.out = 0.0;
        s.stage = kOff;
      }
      break;
    case kOff:
    default:
      s.out = 0.0;
      break;
  }

  return safe(s.out * level);
}

extern "C" int soemdsp_exp_adsr_version() {
  return 1;
}
