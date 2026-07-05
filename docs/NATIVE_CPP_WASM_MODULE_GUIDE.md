# How to make a C++/WASM module

Copy-paste reference. Real code from `quadrature_oscillator`, comments only.

```cpp
// native_modules/quadrature_oscillator/quadrature_oscillator.cpp

// soemdsp-native-module: quadrature_oscillator     // folder name, snake_case
// soemdsp-native-label: Quadrature Oscillator      // display label
// soemdsp-native-target: quadratureOscillator      // node.type, camelCase
// soemdsp-native-kind: oscillator                  // category tag
// soemdsp-native-path: Oscillator/Quadrature/Quadrature Oscillator  // Major/Minor/Name
// soemdsp-native-construction: false               // WIP flag

namespace {

double sinApprox(double value) {
  // Taylor series. No libm in freestanding wasm.
  return value; // placeholder
}

constexpr int kMaxInstances = 16; // fixed instance pool size

struct MyState {
  bool active;
  double u, v;           // algorithm state
  double sinOut, cosOut; // one field per output port
};

static MyState gPool[kMaxInstances]; // instance pool

}  // namespace

extern "C" int soemdsp_quadrature_oscillator_create() {
  for (int i = 0; i < kMaxInstances; i++) {
    if (!gPool[i].active) {
      gPool[i] = MyState{};
      gPool[i].active = true;
      return i + 1; // handle, 1-based
    }
  }
  return 0; // 0 = pool exhausted
}

extern "C" void soemdsp_quadrature_oscillator_destroy(int handle) {
  if (handle < 1 || handle > kMaxInstances) return;
  gPool[handle - 1].active = false;
}

extern "C" void soemdsp_quadrature_oscillator_sample(
  int handle,
  double resetGate,   // gate signal
  double phaseCycles, // 0..1
  double freqHz,
  double sampleRate,
  double amplitude
) {
  if (handle < 1 || handle > kMaxInstances) return;
  MyState& s = gPool[handle - 1];

  // ... compute next sample ...

  s.cosOut = s.u * amplitude;
  s.sinOut = s.v * amplitude;
}

extern "C" double soemdsp_quadrature_oscillator_sin(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].sinOut;
}
extern "C" double soemdsp_quadrature_oscillator_cos(int handle) {
  if (handle < 1 || handle > kMaxInstances) return 0.0;
  return gPool[handle - 1].cosOut;
}

extern "C" int soemdsp_quadrature_oscillator_version() { return 1; }
```

```powershell
# scripts/build_native_modules.ps1 -- one block per module
& $clang `
  --target=wasm32 -O3 -nostdlib -fno-exceptions -fno-rtti `
  "-Wl,--no-entry" `
  "-Wl,--export=soemdsp_quadrature_oscillator_create" `
  "-Wl,--export=soemdsp_quadrature_oscillator_destroy" `
  "-Wl,--export=soemdsp_quadrature_oscillator_sample" `
  "-Wl,--export=soemdsp_quadrature_oscillator_sin" `
  "-Wl,--export=soemdsp_quadrature_oscillator_cos" `
  "-Wl,--export=soemdsp_quadrature_oscillator_version" `
  "-Wl,--export-memory" `
  -o "$root\native_modules\quadrature_oscillator\quadrature_oscillator.wasm" `
  "$root\native_modules\quadrature_oscillator\quadrature_oscillator.cpp"
```

```bash
python scripts/generate_native_modules_catalog.py   # rebuilds public/native-modules-catalog.json from .cpp headers
```

```python
# scripts/smoke_test.py -- export list for this module
"quadrature_oscillator": [
    "soemdsp_quadrature_oscillator_create",
    "soemdsp_quadrature_oscillator_destroy",
    "soemdsp_quadrature_oscillator_sample",
    "soemdsp_quadrature_oscillator_sin",
    "soemdsp_quadrature_oscillator_cos",
],
```

---

## The JS side

```js
// public/node-graph-module-definitions.js

const nodeGraphNodeLabels = Object.freeze({
  quadratureOscillator: "Quadrature Osc", // key: node.type. value: display label.
});

quadratureOscillator: { // key: node.type. value: the module definition.
  displayType: "trace",
  inputs: ["Reset", "0.1V/Oct", "Freq", "Amplitude"],
  outputAliases: { Cos: "cos", Sin: "sin" },
  outputs: ["sin", "cos"],
  parameters: [
    { key: "phase", kind: "phase", label: "Phase", defaultValue: "0", min: "0", max: "1", step: "0.01", unit: "cycle", wraparound: true },
    { key: "freq", kind: "frequency", label: "Freq", defaultValue: "440", min: "0", max: "22050", mid: "440", step: "any", unit: "Hz" },
    { key: "amp", label: "Amp", defaultValue: "1", min: "0", max: "1", mid: "0.5", step: "any" },
  ],
},

const inputCapableSources = new Set([ // node.type values allowed to have unwired inputs
  "clock", "clockDivider", "randomClock",
  "quadratureOscillator",
]);
```

```js
// public/node-graph-module-store.js

const nodeGraphModuleStoreTypes = Object.freeze([
  "quadratureOscillator", // node.type
]);

quadratureOscillator: { // key: node.type. value: Module Browser entry.
  category: "Oscillator",
  description: "...",
  label: "Quadrature Osc",
  notes: ["oscillator", "quadrature", "native"],
},
```

```js
// public/node-live-audio-worklet.js

const nativeStatefulModuleRegistry = Object.freeze([ // one entry per native module
  // ...other entries...
  Object.freeze({
    type: "quadratureOscillator",         // node.type
    nativeName: "quadrature_oscillator",  // catalog name
    stateMapKey: "quadratureOscillatorStates",           // per-node state Map, field name
    nativeFlagKey: "nativeQuadratureOscillator",         // loaded wasm exports, field name
    nativeReadyKey: "nativeQuadratureOscillatorReady",   // ready flag, field name
    createState: "createQuadratureOscillatorState",      // method name, defined below
    destroyNativeState: "destroyQuadratureOscillatorNativeState", // method name, or null
    requiredExports: ["soemdsp_quadrature_oscillator_create", "soemdsp_quadrature_oscillator_sample"],
  }),
]);

createQuadratureOscillatorState() { // per-node state factory
  return { u: 1, v: 0, lastReset: 0, nativeHandle: 0 };
}
destroyQuadratureOscillatorNativeState(state) { // frees the native handle
  if (state?.nativeHandle && this.nativeQuadratureOscillator?.soemdsp_quadrature_oscillator_destroy) {
    this.nativeQuadratureOscillator.soemdsp_quadrature_oscillator_destroy(state.nativeHandle);
    state.nativeHandle = 0;
  }
}
quadratureOscillatorSampleJs(state, options = {}) { // JS implementation of the .cpp math
  // ...
  return { cos: 0, sin: 0 };
}
quadratureOscillatorSample(state, options = {}) { // native call, falls back to JS
  if (this.nativeQuadratureOscillatorReady) {
    try {
      if (!state.nativeHandle) state.nativeHandle = this.nativeQuadratureOscillator.soemdsp_quadrature_oscillator_create();
      if (state.nativeHandle) {
        this.nativeQuadratureOscillator.soemdsp_quadrature_oscillator_sample(state.nativeHandle, /* ...params */);
        return {
          cos: this.safeFilterNumber(this.nativeQuadratureOscillator.soemdsp_quadrature_oscillator_cos(state.nativeHandle), null),
          sin: this.safeFilterNumber(this.nativeQuadratureOscillator.soemdsp_quadrature_oscillator_sin(state.nativeHandle), null),
        };
      }
    } catch (error) {
      this.nativeQuadratureOscillatorReady = false;
    }
  }
  return this.quadratureOscillatorSampleJs(state, options);
}

} else if (node?.type === "quadratureOscillator") { // evaluateFrame dispatch branch
  const state = this.quadratureOscillatorStates.get(nodeId) || this.createQuadratureOscillatorState();
  this.quadratureOscillatorStates.set(nodeId, state);
  const read = (key, fallback) => this.readEffectiveParameter(node, key, fallback, frame, frames, frameValues);
  value = this.quadratureOscillatorSample(state, {
    resetGate: this.safeFilterNumber(mixInput(nodeId, "Reset"), null),
    phaseCycles: read("phase", 0),
    frequencyHz: read("freq", 440),
    sampleRate: this.engineSampleRate || sampleRate,
    amplitude: read("amp", 1),
  });
}
```

```html
<!-- public/index.html -->
<script src="./public/node-graph-module-definitions.js?v=quadrature-osc-2"></script>
```
```python
# server.py
BUILD_NUMBER = "20260810"
```

```bash
python scripts/smoke_test.py
```

```js
// standalone Node.js harness -- runs the worklet class outside a browser
global.sampleRate = 48000;
global.registerProcessor = function () {};
global.AudioWorkletProcessor = class { constructor() { this.port = { postMessage() {} }; } };
const fs = require("fs");
const src = fs.readFileSync(".../public/node-live-audio-worklet.js", "utf8");
const match = src.match(/class (\w+) extends AudioWorkletProcessor/);
const factory = new Function("AudioWorkletProcessor", "registerProcessor", "sampleRate", src + `\nreturn ${match[1]};`);
const proc = new (factory(global.AudioWorkletProcessor, global.registerProcessor, global.sampleRate))();
const state = proc.createQuadratureOscillatorState();
const out = proc.quadratureOscillatorSampleJs(state, { frequencyHz: 440, sampleRate: 48000, amplitude: 1 });
```

```js
// live preview eval
const patch = cloneNodeGraphPatch(nodeGraphMvp.patch);
const node = createNodeGraphPatchNode("quadratureOscillator", { id: "qtest", gx: 2, gy: 2 });
patch.nodes.push(node);
patch.connections.push({ sourceNode: "qtest", sourcePort: "sin", destinationNode: "output", destinationPort: "Mono", tracePoints: [] });
commitNodeGraphPatch(patch, { status: "test" });
nodeGraphBuildLivePlanForPatch(patch);
```
