# Module Translation Worked Example: One-Pole Lowpass Filter

Concrete worked example of the DSP-to-module translation workflow. This
demonstrates how an AI agent translates a DSP algorithm into a complete
sandbox module following the pattern in `MODULE_PATTERN_REFERENCE.md`.

## Input: DSP algorithm

A one-pole lowpass filter. The DSP code:

```cpp
// One-pole lowpass filter
struct OnePoleLowpass {
  double z1 = 0.0;  // previous output sample (state)
};

double process(OnePoleLowpass& state, double input, double cutoffHz, double sampleRate) {
  // Compute coefficient from cutoff frequency
  // tan approximation for bilinear transform
  const double wc = 2.0 * 3.14159265358979 * cutoffHz / sampleRate;
  const double a1 = (1.0 - wc) / (1.0 + wc);
  // Difference equation: y[n] = (1 - a1) * x[n] + a1 * y[n-1]
  const double output = (1.0 - a1) * input + a1 * state.z1;
  state.z1 = output;
  return output;
}
```

## Translation output

The module type name: `onePoleLowpass`.

### 1. Definition (`public/node-graph-module-definitions.js`)

Add to `nodeGraphNodeLabels` (near line 41):

```js
onePoleLowpass: "One-Pole Lowpass",
```

Add to `nodeGraphModuleDefinitions` (near the `gain` entry):

```js
onePoleLowpass: {
  inputs: ["In"],
  outputs: ["Out"],
  parameters: [
    {
      defaultValue: "1000",
      key: "cutoff",
      kind: "frequency",
      label: "Cutoff",
      max: "20000",
      maxDigits: 5,
      mid: "440",
      min: "20",
      nonlinearSlider: true,
      step: "any",
      unit: "Hz",
    },
  ],
},
```

### 2. Add Module menu (`public/index.html`)

```html
<button type="button" role="menuitem" data-context-module="onePoleLowpass">One-Pole Lowpass</button>
```

### 3. Frame evaluator (`public/node-graph-live-frame-evaluator.js`)

Add a branch in `evaluateNodeGraphPlanFrame`, near the `gain` branch:

```js
} else if (node?.type === "onePoleLowpass") {
  const input = mixInput(nodeId);
  const cutoff = readNodeGraphLiveEffectiveParam(
    runtime,
    node,
    "cutoff",
    1000,
    frame,
    frames,
    frameValues,
  );
  const stateKey = nodeId;
  if (!runtime.onePoleLowpassStates) {
    runtime.onePoleLowpassStates = new Map();
  }
  let z1 = runtime.onePoleLowpassStates.get(stateKey);
  if (z1 === undefined) {
    z1 = 0;
  }
  const wc = 2.0 * Math.PI * cutoff / sampleRate;
  const a1 = (1.0 - wc) / (1.0 + wc);
  const output = (1.0 - a1) * input + a1 * z1;
  runtime.onePoleLowpassStates.set(stateKey, output);
  value = output;
}
```

### 4. Worklet (`public/node-live-audio-worklet.js`)

Add a branch in `evaluateFrame`, near the `gain` branch:

```js
} else if (node?.type === "onePoleLowpass") {
  const input = mixInput(nodeId);
  const cutoff = this.readEffectiveParameter(node, "cutoff", 1000, frame, frames, frameValues);
  if (!this.onePoleLowpassStates) {
    this.onePoleLowpassStates = new Map();
  }
  let z1 = this.onePoleLowpassStates.get(nodeId);
  if (z1 === undefined) {
    z1 = 0;
  }
  const wc = 2.0 * Math.PI * cutoff / safeRate;
  const a1 = (1.0 - wc) / (1.0 + wc);
  const output = (1.0 - a1) * input + a1 * z1;
  this.onePoleLowpassStates.set(nodeId, output);
  value = output;
}
```

### 5. State reset on plan change

When the plan changes, filter state must be cleared so stale state from a
removed node does not persist. In the frame evaluator, state lives on the
`runtime` object which is recreated per render, so no explicit reset is
needed for offline render. For live audio, the worklet's `setPlan` method
should clear `this.onePoleLowpassStates`:

```js
// Inside setPlan(), near where other state maps are reset:
this.onePoleLowpassStates = new Map();
```

## Translation rules applied

1. **Module type name** — derived from the DSP algorithm name, camelCase.
2. **Inputs/outputs** — the filter has one audio input and one audio output.
3. **Parameters** — `cutoffHz` becomes a `frequency`-kind parameter named
   `cutoff`. The `nonlinearSlider: true` flag applies skew because
   frequency is perceived logarithmically.
4. **State** — the `z1` field becomes per-node state stored in a `Map`
   keyed by node id. The frame evaluator stores it on `runtime`; the
   worklet stores it on `this`.
5. **Sample rate** — the frame evaluator receives `sampleRate` as an
   argument; the worklet uses `safeRate`.
6. **Constants** — `3.14159265358979` becomes `Math.PI`.
7. **Numeric safety** — for production modules, wrap reads in
   `nodeGraphSafeFilterNumber` (frame evaluator) / `this.safeFilterNumber`
   (worklet) to guard against NaN/Infinity. Omitted here for clarity.

## Verification

After adding the module:

1. Run `python scripts\smoke_test.py` — should pass (no new smoke anchors
   needed until the module is declared durable).
2. Open the sandbox, add an `One-Pole Lowpass` module, connect an
   oscillator to its input and its output to the output module.
3. Render Sample — verify the output is lowpass-filtered.
4. Start Live Audio — verify the same filtering is audible.
5. Sweep the cutoff parameter — verify the filter responds in real time.

## Smoke test anchors (when durable)

When the module becomes part of the durable sandbox contract, add to
`scripts/smoke_test.py`:

```python
# In the node graph MVP contract section:
'onePoleLowpass: "One-Pole Lowpass"',
'onePoleLowpass: {',
'node?.type === "onePoleLowpass"',
```

## Notes

- This example uses a simple tan approximation. For audio-quality filters,
  use the proper bilinear transform with prewarped frequency. The
  translation pattern is the same; only the coefficient math changes.
- The `z1` state is per-node. The `Map<nodeId, number>` pattern scales to
  any number of filter nodes in one patch.
- For multi-state filters (e.g. biquad with `z1` and `z2`), store an
  object in the Map: `Map<nodeId, {z1, z2}>`.
