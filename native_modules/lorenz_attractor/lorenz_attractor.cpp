// soemdsp-native-module: lorenz_attractor
// soemdsp-native-label: Lorenz Attractor
// soemdsp-native-target: lorenzAttractor
// soemdsp-native-kind: chaos
// soemdsp-native-path: Chaos/Attractor/Lorenz Attractor
// soemdsp-native-construction: false

namespace {

static const int kMaxInstances = 32;

struct LorenzState {
  bool active;
  bool resetWasHigh;
  double x;
  double y;
  double z;
};

static LorenzState gPool[kMaxInstances];

static inline double safe(double v) {
  return (v == v && v > -1.0e300 && v < 1.0e300) ? v : 0.0;
}

static inline double clamp(double v, double lo, double hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

static void reset_state(LorenzState& s) {
  s.x = 0.1;
  s.y = 0.0;
  s.z = 0.0;
}

}  // namespace

extern "C" int soemdsp_lorenz_attractor_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      LorenzState& s = gPool[i];
      s.active = true;
      s.resetWasHigh = false;
      reset_state(s);
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_lorenz_attractor_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" void soemdsp_lorenz_attractor_sample(
  int handle,
  double reset,
  double speed,
  double sigma,
  double rho,
  double beta,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return;
  LorenzState& s = gPool[handle - 1];

  const bool resetHigh = reset > 0.5;
  if (resetHigh && !s.resetWasHigh) {
    reset_state(s);
  }
  s.resetWasHigh = resetHigh;

  const double rate = sampleRate < 1.0 ? 1.0 : sampleRate;
  const double safeSpeed = speed > 0.0 ? speed : 0.0;
  const double safeSigma = sigma > 0.0 ? sigma : 0.0;
  const double safeRho = safe(rho);
  const double safeBeta = beta > 0.0 ? beta : 0.0;

  const double dt = (0.75 * safeSpeed) / rate;
  int steps = (int)(dt / 0.0007 + 0.9999999);
  if (steps < 1) steps = 1;
  const double stepDt = steps > 0 ? dt / steps : 0.0;

  for (int i = 0; i < steps; i++) {
    const double dx = safeSigma * (s.y - s.x);
    const double dy = s.x * (safeRho - s.z) - s.y;
    const double dz = s.x * s.y - safeBeta * s.z;
    s.x += dx * stepDt;
    s.y += dy * stepDt;
    s.z += dz * stepDt;
    if (s.x != s.x || s.y != s.y || s.z != s.z) {
      reset_state(s);
      break;
    }
  }
}

extern "C" double soemdsp_lorenz_attractor_x(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].x / 24.0;
}

extern "C" double soemdsp_lorenz_attractor_y(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].y / 32.0;
}

extern "C" double soemdsp_lorenz_attractor_z(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return (gPool[handle - 1].z - 25.0) / 30.0;
}

extern "C" int soemdsp_lorenz_attractor_version() {
  return 1;
}
