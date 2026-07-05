// soemdsp-native-module: chua_attractor
// soemdsp-native-label: Chua Attractor
// soemdsp-native-target: chuaAttractor
// soemdsp-native-kind: chaos
// soemdsp-native-path: Chaos/Attractor/Chua Attractor
// soemdsp-native-construction: false

namespace {

static const int kMaxInstances = 32;

struct ChuaState {
  bool active;
  bool resetWasHigh;
  double x;
  double y;
  double z;
};

static ChuaState gPool[kMaxInstances];

double absValue(double v) {
  return v < 0.0 ? -v : v;
}

double safe(double v) {
  return (v == v && v > -1.0e300 && v < 1.0e300) ? v : 0.0;
}

double clamp(double v, double lo, double hi) {
  return v < lo ? lo : (v > hi ? hi : v);
}

// Chua diode piecewise-linear nonlinearity.
double chuaDiode(double x, double m0, double m1) {
  return m1 * x + 0.5 * (m0 - m1) * (absValue(x + 1.0) - absValue(x - 1.0));
}

void resetChuaState(ChuaState& s) {
  s.x = 0.1;
  s.y = 0.0;
  s.z = 0.0;
}

}  // namespace

extern "C" int soemdsp_chua_attractor_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      ChuaState& s = gPool[i];
      s.active = true;
      s.resetWasHigh = false;
      resetChuaState(s);
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_chua_attractor_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" void soemdsp_chua_attractor_sample(
  int handle,
  double reset,
  double speed,
  double alpha,
  double beta,
  double m0,
  double m1,
  double sampleRate
) {
  if (handle < 1 || handle > kMaxInstances) return;
  ChuaState& s = gPool[handle - 1];

  const bool resetHigh = reset > 0.5;
  if (resetHigh && !s.resetWasHigh) {
    resetChuaState(s);
  }
  s.resetWasHigh = resetHigh;

  const double rate = sampleRate < 1.0 ? 1.0 : sampleRate;
  const double safeSpeed = speed > 0.0 ? speed : 0.0;
  const double safeAlpha = safe(alpha);
  const double safeBeta = safe(beta);
  const double safeM0 = safe(m0);
  const double safeM1 = safe(m1);

  // Same fixed-substep integration strategy as the Lorenz attractor: derive
  // a small step count from the requested dt so fast "speed" settings don't
  // destabilize the explicit Euler integration.
  const double dt = (0.6 * safeSpeed) / rate;
  int steps = (int)(dt / 0.0004);
  if (steps < 1) steps = 1;
  const double stepDt = steps > 0 ? dt / steps : 0.0;

  for (int i = 0; i < steps; i++) {
    const double fx = chuaDiode(s.x, safeM0, safeM1);
    const double dx = safeAlpha * (s.y - s.x - fx);
    const double dy = s.x - s.y + s.z;
    const double dz = -safeBeta * s.y;
    s.x += dx * stepDt;
    s.y += dy * stepDt;
    s.z += dz * stepDt;
    if (s.x != s.x || s.y != s.y || s.z != s.z) {
      resetChuaState(s);
      break;
    }
  }
  s.x = clamp(s.x, -20.0, 20.0);
  s.y = clamp(s.y, -20.0, 20.0);
  s.z = clamp(s.z, -20.0, 20.0);
}

extern "C" double soemdsp_chua_attractor_x(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return clamp(gPool[handle - 1].x / 2.0, -1.0, 1.0);
}

extern "C" double soemdsp_chua_attractor_y(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return clamp(gPool[handle - 1].y / 0.5, -1.0, 1.0);
}

extern "C" double soemdsp_chua_attractor_z(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return clamp(gPool[handle - 1].z / 3.5, -1.0, 1.0);
}

extern "C" int soemdsp_chua_attractor_version() {
  return 1;
}
