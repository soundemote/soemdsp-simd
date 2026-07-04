// soemdsp-native-module: change_detector
// soemdsp-native-label: Change Detector
// soemdsp-native-target: changeDetector
// soemdsp-native-kind: utility
//
// Compares each incoming sample to the previous one and fires a single
// sample of amplitude 1.0 on whichever output matches what happened:
//   +  -- value went up
//   ~  -- value stayed the same
//   -  -- value went down
//   *  -- value changed (either up or down)
// All four outputs are 0.0 outside of the sample where their condition
// holds -- since each is only ever set on the current sample and never
// held, they are inherently single-sample pulses.

namespace {

static const int kMaxInstances = 32;

struct ChangeDetectorState {
  bool active;
  double lastValue;
  double up;
  double same;
  double down;
  double changed;
};

static ChangeDetectorState gPool[kMaxInstances];

}  // namespace

extern "C" int soemdsp_change_detector_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      ChangeDetectorState& s = gPool[i];
      s.lastValue = 0.0;
      s.up = 0.0;
      s.same = 0.0;
      s.down = 0.0;
      s.changed = 0.0;
      s.active = true;
      return i + 1;
    }
  }
  return 0;
}

extern "C" void soemdsp_change_detector_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" void soemdsp_change_detector_sample(int handle, double input) {
  if (handle < 1 || handle > kMaxInstances) return;
  ChangeDetectorState& s = gPool[handle - 1];

  if (input > s.lastValue) {
    s.up = 1.0;
    s.same = 0.0;
    s.down = 0.0;
    s.changed = 1.0;
  } else if (input < s.lastValue) {
    s.up = 0.0;
    s.same = 0.0;
    s.down = 1.0;
    s.changed = 1.0;
  } else {
    s.up = 0.0;
    s.same = 1.0;
    s.down = 0.0;
    s.changed = 0.0;
  }

  s.lastValue = input;
}

extern "C" double soemdsp_change_detector_up(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].up;
}

extern "C" double soemdsp_change_detector_same(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].same;
}

extern "C" double soemdsp_change_detector_down(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].down;
}

extern "C" double soemdsp_change_detector_changed(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].changed;
}

extern "C" int soemdsp_change_detector_version() {
  return 1;
}
