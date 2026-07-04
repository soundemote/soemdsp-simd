# OSC Module Non-UI Reference

AI-facing reference for designing a hardcoded WebUI module from the current OSC
module. Keep this compact. The code is the source of meaning.

Excluded:

- UI menu HTML
- DOM construction
- click handlers
- modular layout
- offline Render Sample behavior

Define these:

- module key
- ports
- parameters
- patch defaults
- DSP helper functions
- Live Audio branch
- per-node state
- output value

## Anchors

- `public/node-graph-module-definitions.js` — `nodeGraphModuleDefinitions`
- `public/node-graph-oscillator-runtime.js` — `nodeGraphOscillatorWaveformSample(runtime, nodeId, phase, phaseIncrement, waveform)`
- `public/node-graph-default-patch.js` — `createNodeGraphPatchNode(...)`
- `public/node-live-audio-worklet.js`
  - `NodeLiveAudioProcessor.evaluateFrame(...)`

## Parameter Objects

Basic numeric parameter:

```js
{
  defaultValue: "220",
  key: "frequency",
  label: "Frequency",
  max: "880",
  mid: "220",
  min: "80",
  step: "1",
}
```

Discrete choice parameter:

```js
{
  choices: ["Saw", "Square", "Triangle", "Sine", "Noise"],
  defaultValue: "0",
  displayChoices: true,
  key: "waveform",
  kind: "waveform",
  label: "Waveform",
  linearSmoothing: false,
  max: "4",
  mid: "2",
  min: "0",
  step: "1",
}
```

Runtime reads by `key`:

```js
const frequency = this.readEffectiveParameter(
  node,
  "frequency",
  220,
  frame,
  frames,
  frameValues,
);
```

## Module Definition

```js
const nodeGraphModuleDefinitions = Object.freeze({
  osc: {
    outputs: ["Out"],
    parameters: [
      {
        choices: ["Saw", "Square", "Triangle", "Sine", "Noise"],
        defaultValue: "0",
        displayChoices: true,
        key: "waveform",
        kind: "waveform",
        label: "Waveform",
        linearSmoothing: false,
        max: "4",
        mid: "2",
        min: "0",
        step: "1",
      },
      {
        defaultValue: "220",
        key: "frequency",
        label: "Frequency",
        max: "880",
        mid: "220",
        min: "80",
        step: "1",
      },
      {
        defaultValue: "0",
        key: "phase",
        kind: "phase",
        label: "Phase",
        max: "1",
        mid: "0.5",
        min: "0",
        step: "0.01",
        unit: "cycle",
        wraparound: true,
      },
      {
        defaultValue: "0.35",
        key: "level",
        label: "Amplitude",
        max: "0.8",
        mid: "0.35",
        min: "0",
        step: "0.01",
      },
    ],
  },
});
```

Module shapes:

```js
source: {
  outputs: ["Out"],
  parameters: [],
}

processor: {
  inputs: ["In"],
  outputs: ["Out"],
  parameters: [],
}
```

## Patch Instance Defaults

```js
function createNodeGraphPatchNode(type, options = {}) {
  return {
    gx: Number.isFinite(Number(options.gx)) ? Number(options.gx) : 0,
    gy: Number.isFinite(Number(options.gy)) ? Number(options.gy) : 0,
    id: String(options.id || type),
    paramMeta: nodeGraphDefaultParamMetaForType(type),
    params: nodeGraphDefaultParamsForType(type),
    type,
  };
}
```

Template result shape:

```js
{
  id: "osc-2",
  type: "osc",
  params: {
    waveform: 0,
    frequency: 220,
    phase: 0,
    level: 0.35,
  },
  paramMeta: {
    waveform: {},
    frequency: {},
    phase: {},
    level: {},
  },
}
```

## DSP Helper

```js
function nodeGraphOscillatorWaveformSample(runtime, nodeId, phase, waveform) {
  const phaseCycle = wrapNodeSliderValue(phase / (Math.PI * 2), 0, 1);

  switch (Math.round(Number(waveform) || 0)) {
    case 1:
      return phaseCycle < 0.5 ? 1 : -1;
    case 2:
      return 1 - Math.abs(phaseCycle - 0.5) * 4;
    case 3:
      return Math.sin(phase);
    case 4:
      return nextNodeGraphNoiseSample(runtime, nodeId);
    case 0:
    default:
      return 1 - phaseCycle * 2;
  }
}
```

## Live Audio Branch

```js
if (node?.type === "osc") {
  const phase = this.phases.get(nodeId) || 0;
  const phaseOffset = this.phaseRadians(
    this.readEffectiveParameter(node, "phase", 0, frame, frames, frameValues),
  );
  const frequency = this.readEffectiveParameter(
    node,
    "frequency",
    220,
    frame,
    frames,
    frameValues,
  );
  const waveform = this.readEffectiveParameter(
    node,
    "waveform",
    0,
    frame,
    frames,
    frameValues,
  );
  value = this.oscillatorSample(nodeId, phase + phaseOffset, waveform) *
    this.readEffectiveParameter(node, "level", 0.35, frame, frames, frameValues);
  this.phases.set(
    nodeId,
    (phase + (Math.PI * 2 * frequency) / sampleRate) % (Math.PI * 2),
  );
}
```

## AI Notes

- `key` binds parameter definition to runtime reads.
- Choice params are numeric at runtime.
- Store per-instance runtime state by `nodeId`.
- Source modules can omit `inputs`.
- Processor modules need `inputs` and `outputs`.
- Patch nodes are instances; module definitions are templates.
- This file excludes UI and offline render on purpose.
