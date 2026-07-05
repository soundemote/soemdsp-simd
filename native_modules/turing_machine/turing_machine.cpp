// soemdsp-native-module: turing_machine
// soemdsp-native-label: Turing Machine
// soemdsp-native-target: turingMachine
// soemdsp-native-kind: sequencer
// soemdsp-native-path: Sequencer/Generative/Turing Machine
// soemdsp-native-construction: false

// Ported from turingMachineSample in public/node-live-audio-worklet.js. The
// original used Math.random() for the bit-flip decision -- WASM has no
// entropy source and this module is instantiated with an empty imports
// object, so the JS wrapper draws Math.random() once per call and passes it
// in as `randomDraw`. Only consumed on a clock rising edge (matching the
// original's `Math.random() < probability` gate), so behavior is identical,
// not a deterministic-PRNG substitute.

namespace {

static const int kMaxInstances = 32;

struct TuringState {
  bool active;
  bool clockWasHigh;
  bool resetWasHigh;
  int registerValue;
};

static TuringState gPool[kMaxInstances];

static inline double safe(double x) { return x * 0.0 == 0.0 ? x : 0.0; }
static inline double clamp(double x, double lo, double hi) { return x < lo ? lo : (x > hi ? hi : x); }

}  // namespace

extern "C" int soemdsp_turing_machine_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      TuringState& s = gPool[i];
      s.active = true;
      s.clockWasHigh = false;
      s.resetWasHigh = false;
      s.registerValue = 0;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_turing_machine_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

// Returns "CV"; "Scale" and "Gate" are retrieved via the getters below.
extern "C" double soemdsp_turing_machine_sample(
  int    handle,
  double clock,
  double reset,
  double length,
  double probability,
  double level,
  double randomDraw
) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  TuringState& s = gPool[handle - 1];

  const bool clockHigh = safe(clock) > 0.0;
  const bool resetHigh = safe(reset) > 0.0;
  int lengthVal = (int)(length + 0.5);
  if (lengthVal < 1) lengthVal = 1;
  if (lengthVal > 16) lengthVal = 16;
  const double probabilityVal = clamp(safe(probability), 0.0, 1.0);
  const double safeLevel = safe(level);

  if (resetHigh && !s.resetWasHigh) {
    s.registerValue = 0;
  }
  s.resetWasHigh = resetHigh;

  if (clockHigh && !s.clockWasHigh) {
    const int mask = (1 << lengthVal) - 1;
    const int topBit = (s.registerValue >> (lengthVal - 1)) & 1;
    const int newBit = randomDraw < probabilityVal ? 1 - topBit : topBit;
    s.registerValue = ((s.registerValue << 1) | newBit) & mask;
  }
  s.clockWasHigh = clockHigh;

  const int mask = (1 << lengthVal) - 1;
  const int maxValue = mask > 0 ? mask : 1;
  const double cv = ((double)s.registerValue / (double)maxValue) * 2.0 - 1.0;
  return cv * safeLevel;
}

extern "C" int soemdsp_turing_machine_scale(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0;
  return gPool[handle - 1].registerValue & 0xFFF;
}

extern "C" double soemdsp_turing_machine_gate(int handle, double level) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return (double)(gPool[handle - 1].registerValue & 1) * level;
}

extern "C" int soemdsp_turing_machine_version() {
  return 1;
}
