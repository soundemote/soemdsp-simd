// soemdsp-native-module: slew_limiter
// soemdsp-native-label: Slew Limiter
// soemdsp-native-target: slewLimiter
// soemdsp-native-kind: utility

namespace {

static const int kMaxInstances = 64;

struct SlewState {
  bool initialized;
  double out;
  bool active;
};

static SlewState gPool[kMaxInstances];

static inline double safe(double x) { return x * 0.0 == 0.0 ? x : 0.0; }

}  // namespace

extern "C" int soemdsp_slew_limiter_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      SlewState& s = gPool[i];
      s.initialized = false;
      s.out = 0.0;
      s.active = true;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_slew_limiter_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" double soemdsp_slew_limiter_sample(
  int    handle,
  double input,
  double upTime,
  double downTime,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  SlewState& s = gPool[handle - 1];

  const double rate = sampleRate < 1.0 ? 44100.0 : sampleRate;
  const double target = safe(input);

  if (!s.initialized) {
    s.initialized = true;
    s.out = target;
    return target;
  }

  const double upSeconds = upTime < 0.0 ? 0.0 : upTime;
  const double downSeconds = downTime < 0.0 ? 0.0 : downTime;
  const double delta = target - s.out;

  const double maxRise = upSeconds <= 0.0 ? 1e300 : 1.0 / (upSeconds * rate < 1.0 ? 1.0 : upSeconds * rate);
  const double maxFall = downSeconds <= 0.0 ? 1e300 : 1.0 / (downSeconds * rate < 1.0 ? 1.0 : downSeconds * rate);

  const double clamped = delta > maxRise ? maxRise : (delta < -maxFall ? -maxFall : delta);
  s.out = safe(s.out + clamped);
  return s.out;
}

extern "C" int soemdsp_slew_limiter_version() {
  return 1;
}
