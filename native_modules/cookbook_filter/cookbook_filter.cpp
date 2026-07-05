// soemdsp-native-module: cookbook_filter
// soemdsp-native-label: Cookbook Filter
// soemdsp-native-target: cookbookFilter
// soemdsp-native-kind: filter
// soemdsp-native-path: Filter/Biquad/Cookbook Filter
// soemdsp-native-construction: false

// RBJ "Audio EQ Cookbook" biquad, cascaded up to 5 stages. Modes: 0=Off,
// 1=LP, 2=HP, 3=BP(csg), 4=BP(peak), 5=Notch, 6=APF, 7=PeakingEQ,
// 8=LowShelf, 9=HighShelf -- matches cookbookFilterCoefficients in
// public/node-live-audio-worklet.js exactly.

namespace {

static const int kMaxInstances = 32;
static const int kMaxStages = 5;
static const double kPi = 3.14159265358979323846;
static const double kTwoPi = 6.28318530717958647693;

struct CookbookState {
  bool active;
  int lastStages;
  double x1[kMaxStages];
  double x2[kMaxStages];
  double y1[kMaxStages];
  double y2[kMaxStages];
};

static CookbookState gPool[kMaxInstances];

static inline double safe(double x) { return x * 0.0 == 0.0 ? x : 0.0; }
static inline double clamp(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }

// Fast double-precision inverse-sqrt (generalized "Quake" bit trick) refined
// with 3 Newton iterations -- converges to near machine precision, unlike
// the single-iteration float version, since this feeds filter Q/gain math.
static double dsp_sqrt(double x) {
  if (x <= 0.0) return 0.0;
  union { double d; long long i; } u;
  u.d = x;
  u.i = 0x5fe6ec85e7de30daLL - (u.i >> 1);
  double y = u.d;
  const double halfx = 0.5 * x;
  y = y * (1.5 - halfx * y * y);
  y = y * (1.5 - halfx * y * y);
  y = y * (1.5 - halfx * y * y);
  return x * y;
}

// Fast approximate pow(base, exponent) for base > 0 -- same Schraudolph
// bit-manipulation trick used elsewhere in this codebase (vactrol_envelope,
// exp_adsr): good to within a few percent, acceptable for a shelf-filter
// gain coefficient.
static inline double dsp_pow(double base, double exponent) {
  if (base <= 0.0) return 0.0;
  union { double d; int x[2]; } u;
  u.d = base;
  u.x[1] = (int)(exponent * (double)(u.x[1] - 1072632447) + 1072632447.0);
  u.x[0] = 0;
  return u.d;
}

// sin/cos via Taylor series (Horner form in x^2), accurate on [-pi, pi] --
// the only range omega = 2*pi*freq/rate ever occupies given freq is clamped
// to [20, min(20000, rate*0.49)].
static double dsp_sin(double x) {
  const double x2 = x * x;
  const double poly = 1.0 + x2*(-1.0/6.0 + x2*(1.0/120.0 + x2*(-1.0/5040.0 + x2*(1.0/362880.0 + x2*(-1.0/39916800.0)))));
  return x * poly;
}

static double dsp_cos(double x) {
  const double x2 = x * x;
  return 1.0 + x2*(-0.5 + x2*(1.0/24.0 + x2*(-1.0/720.0 + x2*(1.0/40320.0 + x2*(-1.0/3628800.0 + x2*(1.0/479001600.0))))));
}

static int stage_count(double stages) {
  if (stages != stages) return 2;  // NaN guard
  const int value = (int)(stages >= 0.0 ? stages + 0.5 : stages - 0.5);
  return value < 0 ? 0 : (value > kMaxStages ? kMaxStages : value);
}

struct Coeffs { double a1, a2, b0, b1, b2; };

static Coeffs cookbook_coefficients(int mode, double frequency, double q, double gainDb, double rate) {
  if (mode == 0) {
    return { 0.0, 0.0, 1.0, 0.0, 0.0 };
  }
  const double safeRate = rate < 1.0 ? 44100.0 : rate;
  const double freqMax = 20000.0 < safeRate * 0.49 ? 20000.0 : safeRate * 0.49;
  double freq = frequency == frequency ? frequency : 1000.0;
  freq = clamp(freq, 20.0, freqMax);
  const double safeQ = q > 0.0001 ? q : 0.0001;
  const double omega = kTwoPi * freq / safeRate;
  const double sine = dsp_sin(omega);
  const double cosine = dsp_cos(omega);
  const double alpha = sine / (2.0 * safeQ);
  const double amplitude = dsp_pow(10.0, 0.025 * gainDb);
  const double beta = dsp_sqrt(amplitude) / safeQ;

  double a0 = 1.0 + alpha;
  double a1 = -2.0 * cosine;
  double a2 = 1.0 - alpha;
  double b0 = 1.0;
  double b1 = 0.0;
  double b2 = 0.0;

  switch (mode) {
    case 1:
      b1 = 1.0 - cosine;
      b0 = b1 * 0.5;
      b2 = b0;
      break;
    case 2:
      b1 = -(1.0 + cosine);
      b0 = -b1 * 0.5;
      b2 = b0;
      break;
    case 3:
      b0 = safeQ * alpha;
      b2 = -b0;
      break;
    case 4:
      b0 = alpha;
      b2 = -alpha;
      break;
    case 5:
      b0 = 1.0;
      b1 = -2.0 * cosine;
      b2 = 1.0;
      break;
    case 6:
      b0 = 1.0 - alpha;
      b1 = -2.0 * cosine;
      b2 = 1.0 + alpha;
      break;
    case 7:
      a0 = 1.0 + alpha / amplitude;
      a2 = 1.0 - alpha / amplitude;
      b0 = 1.0 + alpha * amplitude;
      b1 = -2.0 * cosine;
      b2 = 1.0 - alpha * amplitude;
      break;
    case 8:
      a0 = (amplitude + 1.0) + (amplitude - 1.0) * cosine + beta * sine;
      a1 = -2.0 * ((amplitude - 1.0) + (amplitude + 1.0) * cosine);
      a2 = (amplitude + 1.0) + (amplitude - 1.0) * cosine - beta * sine;
      b0 = amplitude * ((amplitude + 1.0) - (amplitude - 1.0) * cosine + beta * sine);
      b1 = 2.0 * amplitude * ((amplitude - 1.0) - (amplitude + 1.0) * cosine);
      b2 = amplitude * ((amplitude + 1.0) - (amplitude - 1.0) * cosine - beta * sine);
      break;
    case 9:
      a0 = (amplitude + 1.0) - (amplitude - 1.0) * cosine + beta * sine;
      a1 = 2.0 * ((amplitude - 1.0) - (amplitude + 1.0) * cosine);
      a2 = (amplitude + 1.0) - (amplitude - 1.0) * cosine - beta * sine;
      b0 = amplitude * ((amplitude + 1.0) + (amplitude - 1.0) * cosine + beta * sine);
      b1 = -2.0 * amplitude * ((amplitude - 1.0) + (amplitude + 1.0) * cosine);
      b2 = amplitude * ((amplitude + 1.0) + (amplitude - 1.0) * cosine - beta * sine);
      break;
    default:
      break;
  }

  const double scale = a0 != 0.0 ? 1.0 / a0 : 1.0;
  return { a1 * scale, a2 * scale, b0 * scale, b1 * scale, b2 * scale };
}

static void reset_state(CookbookState& s) {
  for (int i = 0; i < kMaxStages; i++) {
    s.x1[i] = 0.0; s.x2[i] = 0.0; s.y1[i] = 0.0; s.y2[i] = 0.0;
  }
}

}  // namespace

extern "C" int soemdsp_cookbook_filter_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      CookbookState& s = gPool[i];
      s.active = true;
      s.lastStages = 2;
      reset_state(s);
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_cookbook_filter_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" double soemdsp_cookbook_filter_sample(
  int    handle,
  double input,
  int    mode,
  double frequency,
  double q,
  double gainDb,
  double stages,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return safe(input);
  CookbookState& s = gPool[handle - 1];

  const int stageCount = stage_count(stages);
  if (stageCount <= 0 || mode == 0) {
    return safe(input);
  }
  if (s.lastStages != stageCount) {
    reset_state(s);
    s.lastStages = stageCount;
  }

  const Coeffs coeff = cookbook_coefficients(mode, frequency, q, gainDb, sampleRate);
  double value = safe(input);
  for (int i = 0; i < stageCount; i++) {
    const double previousInput = value;
    value = coeff.b0 * value + coeff.b1 * s.x1[i] + coeff.b2 * s.x2[i]
      - coeff.a1 * s.y1[i] - coeff.a2 * s.y2[i];
    s.x2[i] = s.x1[i];
    s.x1[i] = previousInput;
    s.y2[i] = s.y1[i];
    s.y1[i] = value;
  }
  return safe(value);
}

extern "C" int soemdsp_cookbook_filter_version() {
  return 1;
}
