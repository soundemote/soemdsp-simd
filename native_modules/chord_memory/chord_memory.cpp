// soemdsp-native-module: chord_memory
// soemdsp-native-label: Chord Memory
// soemdsp-native-target: chordMemory
// soemdsp-native-kind: sequencer
// soemdsp-native-path: Sequencer/Chord/Chord Memory
// soemdsp-native-construction: false

// Ported from chordMemorySample in public/node-live-audio-worklet.js:
// a 4-slot latch/clear/advance-arp register, all integer/edge-detection
// logic with no continuous math.

namespace {

static const int kMaxInstances = 32;

struct ChordMemoryState {
  bool active;
  bool latchWasHigh;
  bool clearWasHigh;
  bool advanceWasHigh;
  int writeIndex;
  int arpIndex;
  double slots[4];
  bool slotsActive[4];
};

static ChordMemoryState gPool[kMaxInstances];

static inline double safe(double x) { return x * 0.0 == 0.0 ? x : 0.0; }

}  // namespace

extern "C" int soemdsp_chord_memory_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      ChordMemoryState& s = gPool[i];
      s.active = true;
      s.latchWasHigh = false;
      s.clearWasHigh = false;
      s.advanceWasHigh = false;
      s.writeIndex = 0;
      s.arpIndex = 0;
      for (int k = 0; k < 4; k++) { s.slots[k] = 0.0; s.slotsActive[k] = false; }
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_chord_memory_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

// Advances internal state and returns "Gate"; the four note outputs and
// "Arp" are retrieved via the getters below (matches the multi-output
// create/sample/getter pattern used by lorenz_attractor's x/y/z).
extern "C" double soemdsp_chord_memory_sample(
  int    handle,
  double latch,
  double clear,
  double advance,
  double pitch
) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  ChordMemoryState& s = gPool[handle - 1];

  const bool latchHigh = safe(latch) > 0.0;
  const bool clearHigh = safe(clear) > 0.0;
  const bool advanceHigh = safe(advance) > 0.0;
  const double safePitch = safe(pitch);

  if (clearHigh && !s.clearWasHigh) {
    for (int k = 0; k < 4; k++) { s.slots[k] = 0.0; s.slotsActive[k] = false; }
    s.writeIndex = 0;
    s.arpIndex = 0;
  }
  s.clearWasHigh = clearHigh;

  if (latchHigh && !s.latchWasHigh) {
    s.slots[s.writeIndex] = safePitch;
    s.slotsActive[s.writeIndex] = true;
    s.writeIndex = (s.writeIndex + 1) % 4;
  }
  s.latchWasHigh = latchHigh;

  int activeIndices[4];
  int activeCount = 0;
  for (int i = 0; i < 4; i++) {
    if (s.slotsActive[i]) activeIndices[activeCount++] = i;
  }

  if (advanceHigh && !s.advanceWasHigh && activeCount > 0) {
    int currentPos = -1;
    for (int i = 0; i < activeCount; i++) {
      if (activeIndices[i] == s.arpIndex) { currentPos = i; break; }
    }
    const int nextPos = currentPos == -1 ? 0 : (currentPos + 1) % activeCount;
    s.arpIndex = activeIndices[nextPos];
  }
  s.advanceWasHigh = advanceHigh;

  return activeCount > 0 ? 1.0 : 0.0;
}

extern "C" double soemdsp_chord_memory_note(int handle, int index) {
  if (handle < 1 || handle > kMaxInstances || index < 0 || index > 3) return 0.0;
  return gPool[handle - 1].slots[index];
}

extern "C" double soemdsp_chord_memory_arp(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  ChordMemoryState& s = gPool[handle - 1];
  bool anyActive = false;
  for (int i = 0; i < 4; i++) if (s.slotsActive[i]) anyActive = true;
  return anyActive ? s.slots[s.arpIndex] : 0.0;
}

extern "C" int soemdsp_chord_memory_version() {
  return 1;
}
