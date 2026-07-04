// Built-in "trigger patch" circuits -- small reusable sourcePatch JSON,
// the same shape a moduleGroup embeds (see node-graph-parameter-metadata.js's
// normalizeNodeGraphModuleGroup / nodeGraphModuleGroupInterfaceFromPatch).
// Each has exactly one groupInput (aliased "Gate", driven by whoever binds
// the trigger -- 1 while held or for a single sample when fired, 0
// otherwise) and one groupOutput (aliased "Out").
//
// This file is main-thread only: it's read by node-graph-external-ui-events.js
// at bind time, which compiles the sourcePatch (via nodeGraphBuildLivePlanForPatch)
// and resolves the Gate/Out node ids (via nodeGraphModuleGroupInterfaceFromPatch)
// *before* sending the already-compiled plan across to the worklet. The
// worklet's isolated AudioWorkletGlobalScope never loads this file directly,
// the same reason dsf_oscillator/robin_supersaw inline their own JS
// fallbacks instead of sharing globals across that boundary.

function nodeGraphTriggerPatchOneSampleImpulseSourcePatch() {
  return {
    nodes: [
      { id: "gateIn", type: "groupInput", alias: "Gate", x: 0, y: 0 },
      { id: "out", type: "groupOutput", alias: "Out", x: 200, y: 0 },
    ],
    connections: [
      { sourceNode: "gateIn", sourcePort: "Out", destinationNode: "out", destinationPort: "In" },
    ],
  };
}

function nodeGraphTriggerPatchEnvelopeSourcePatch() {
  return {
    nodes: [
      { id: "gateIn", type: "groupInput", alias: "Gate", x: 0, y: 0 },
      {
        id: "env", type: "expAdsr", x: 200, y: 0,
        params: {
          delay: 0, attack: 0.001, decay: 0.25, sustain: 0, release: 0.05,
          attackShape: 0.3, releaseShape: 0.0001, loop: 0, level: 1,
        },
      },
      { id: "out", type: "groupOutput", alias: "Out", x: 400, y: 0 },
    ],
    connections: [
      { sourceNode: "gateIn", sourcePort: "Out", destinationNode: "env", destinationPort: "Gate" },
      { sourceNode: "env", sourcePort: "Out", destinationNode: "out", destinationPort: "In" },
    ],
  };
}

function nodeGraphTriggerPatchImpulseTrainSourcePatch(speed = 4, randomization = 0) {
  const { minSeconds, maxSeconds } = nodeGraphTriggerPatchImpulseTrainParams(speed, randomization);
  return {
    nodes: [
      { id: "gateIn", type: "groupInput", alias: "Gate", x: 0, y: 0 },
      {
        id: "rndClock", type: "randomClock", x: 200, y: 0,
        params: { minSeconds, maxSeconds, duty: 0.5, triggerTime: 0.01, level: 0, seed: 1, threshold: 0 },
      },
      { id: "out", type: "groupOutput", alias: "Out", x: 400, y: 0 },
    ],
    connections: [
      { sourceNode: "rndClock", sourcePort: "Trigger", destinationNode: "out", destinationPort: "In" },
    ],
    modulations: [
      { sourceNode: "gateIn", sourcePort: "Out", destinationNode: "rndClock", destinationParam: "level" },
    ],
  };
}

// speed: Hz-ish base rate. randomization: 0 = fixed-rate clock (min == max),
// 1 = fully randomized timing spanning roughly a decade around the base
// interval. randomClock's own minSeconds/maxSeconds already span exactly
// this range -- no separate clock/randomClock crossfade needed.
function nodeGraphTriggerPatchImpulseTrainParams(speed, randomization) {
  const safeSpeed = Math.max(0.05, Number(speed) || 4);
  const safeRandomization = Math.max(0, Math.min(1, Number(randomization) || 0));
  const baseInterval = 1 / safeSpeed;
  const spread = safeRandomization * baseInterval * 4;
  return {
    minSeconds: Math.max(0.001, baseInterval - spread * 0.5),
    maxSeconds: Math.max(0.002, baseInterval + spread * 0.5),
  };
}

function nodeGraphTriggerPatchNoiseSourcePatch() {
  return {
    nodes: [
      { id: "gateIn", type: "groupInput", alias: "Gate", x: 0, y: 0 },
      { id: "src", type: "noiseGenerator", x: 200, y: 0, params: { mode: 0, mean: 0, deviation: 0.5, seed: 1, level: 1 } },
      { id: "vca", type: "gain", x: 400, y: 0, params: { amount: 0 } },
      { id: "out", type: "groupOutput", alias: "Out", x: 600, y: 0 },
    ],
    connections: [
      { sourceNode: "src", sourcePort: "Left Out", destinationNode: "vca", destinationPort: "In" },
      { sourceNode: "vca", sourcePort: "Out", destinationNode: "out", destinationPort: "In" },
    ],
    modulations: [
      { sourceNode: "gateIn", sourcePort: "Out", destinationNode: "vca", destinationParam: "amount" },
    ],
  };
}

function nodeGraphTriggerPatchSineSourcePatch(frequencyHz) {
  return {
    nodes: [
      { id: "gateIn", type: "groupInput", alias: "Gate", x: 0, y: 0 },
      { id: "src", type: "sineWavetable", x: 200, y: 0, params: { phase: 0, freq: frequencyHz, amp: 1 } },
      { id: "vca", type: "gain", x: 400, y: 0, params: { amount: 0 } },
      { id: "out", type: "groupOutput", alias: "Out", x: 600, y: 0 },
    ],
    connections: [
      { sourceNode: "src", sourcePort: "sin", destinationNode: "vca", destinationPort: "In" },
      { sourceNode: "vca", sourcePort: "Out", destinationNode: "out", destinationPort: "In" },
    ],
    modulations: [
      { sourceNode: "gateIn", sourcePort: "Out", destinationNode: "vca", destinationParam: "amount" },
    ],
  };
}

const nodeGraphTriggerPatchLibrary = {
  oneSampleImpulse: {
    id: "oneSampleImpulse",
    name: "1-Sample Impulse",
    kind: "sourcePatch",
    activation: "fire",
    sourcePatch: nodeGraphTriggerPatchOneSampleImpulseSourcePatch(),
  },
  envelope025sNearInstant: {
    id: "envelope025sNearInstant",
    name: "0.25s Envelope (Near-Instant Attack)",
    kind: "sourcePatch",
    activation: "fire",
    sourcePatch: nodeGraphTriggerPatchEnvelopeSourcePatch(),
  },
  envelope025sPolyBlepInstant: {
    id: "envelope025sPolyBlepInstant",
    name: "Instant Attack (PolyBLEP)",
    kind: "stepImpulse",
    activation: "fire",
    sourcePatch: null,
  },
  impulseTrainHold: {
    id: "impulseTrainHold",
    name: "Click-Hold Impulse Train",
    kind: "sourcePatch",
    activation: "hold",
    parameters: { speed: 4, randomization: 0 },
    sourcePatch: nodeGraphTriggerPatchImpulseTrainSourcePatch(4, 0),
  },
  noiseHold: {
    id: "noiseHold",
    name: "Click-Hold Noise",
    kind: "sourcePatch",
    activation: "hold",
    sourcePatch: nodeGraphTriggerPatchNoiseSourcePatch(),
  },
  sine440Hold: {
    id: "sine440Hold",
    name: "Click-Hold Sine (A440)",
    kind: "sourcePatch",
    activation: "hold",
    sourcePatch: nodeGraphTriggerPatchSineSourcePatch(440),
  },
  sine100Hold: {
    id: "sine100Hold",
    name: "Click-Hold Sine (A100)",
    kind: "sourcePatch",
    activation: "hold",
    sourcePatch: nodeGraphTriggerPatchSineSourcePatch(100),
  },
};

function nodeGraphTriggerPatchById(id) {
  return nodeGraphTriggerPatchLibrary[String(id || "")] || null;
}

// Rebuilds impulseTrainHold's sourcePatch for a custom speed/randomization
// pair rather than mutating the shared library entry in place.
function nodeGraphTriggerPatchWithImpulseTrainParams(speed, randomization) {
  const base = nodeGraphTriggerPatchLibrary.impulseTrainHold;
  return {
    ...base,
    parameters: { speed, randomization },
    sourcePatch: nodeGraphTriggerPatchImpulseTrainSourcePatch(speed, randomization),
  };
}
