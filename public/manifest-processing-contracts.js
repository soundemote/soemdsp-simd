function callerProcessingOrderIssue(manifest) {
  const expectedByDemo = {
    runtime_dsp_object_circuit_connected_wav_demo: [
      {
        sourceNode: "Tiny Oscillator",
        sourcePort: "Out",
        destinationNode: "Tiny Gain",
        destinationPort: "A",
        callerStep: "oscillator.processSample -> gain.processSample",
      },
      {
        sourceNode: "Tiny Gain",
        sourcePort: "Out",
        destinationNode: "Audio Out",
        destinationPort: "In",
        callerStep: "gain.processSample -> output sample",
      },
    ],
    runtime_dsp_object_circuit_connected_bias_wav_demo: [
      {
        sourceNode: "Tiny Oscillator",
        sourcePort: "Out",
        destinationNode: "Tiny Gain",
        destinationPort: "A",
        callerStep: "oscillator.processSample -> gain.processSample",
      },
      {
        sourceNode: "Tiny Gain",
        sourcePort: "Out",
        destinationNode: "Tiny Bias",
        destinationPort: "A",
        callerStep: "gain.processSample -> bias.processSample",
      },
      {
        sourceNode: "Tiny Bias",
        sourcePort: "Out",
        destinationNode: "Audio Out",
        destinationPort: "In",
        callerStep: "bias.processSample -> output sample",
      },
    ],
  };
  const expectedSteps = expectedByDemo[manifest?.demo];
  if (!expectedSteps) {
    return "";
  }

  const connections = manifest.circuitConnections;
  if (!connections || typeof connections !== "object") {
    return "circuit connections missing";
  }
  if (Number(connections.count) !== expectedSteps.length) {
    return "circuit connection count mismatch";
  }
  if (connections.describesProcessingChain !== true) {
    return "circuit connection chain flag missing";
  }

  const proof = manifest.callerProcessingOrderProof;
  if (!proof || typeof proof !== "object") {
    return "caller processing proof missing";
  }
  if (proof.matchesCircuitConnections !== true) {
    return "caller processing order mismatch";
  }

  const order = manifest.callerProcessingOrder;
  if (!order || typeof order !== "object") {
    return "caller processing order missing";
  }
  if (order.matchesCircuitConnections !== true) {
    return "caller processing order match flag missing";
  }
  if (order.callerOwnsProcessingOrder !== true) {
    return "caller processing ownership missing";
  }

  const steps = order.steps;
  if (!Array.isArray(steps) || steps.length !== expectedSteps.length) {
    return "caller processing step count mismatch";
  }

  for (const [index, expected] of expectedSteps.entries()) {
    const step = steps[index];
    if (!step || typeof step !== "object") {
      return "caller processing step invalid";
    }
    if (Number(step.index) !== index) {
      return "caller processing step index mismatch";
    }
    for (const key of [
      "sourceNode",
      "sourcePort",
      "destinationNode",
      "destinationPort",
      "callerStep",
    ]) {
      if (step[key] !== expected[key]) {
        return "caller processing step mismatch";
      }
    }
  }

  return "";
}
