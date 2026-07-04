function createNodeGraphHighpassState() {
  return {
    inputBuffer: 0,
    outputBuffer: 0,
  };
}

function nodeGraphExternalButtonEventPulse(runtime, name) {
  const events = runtime?.externalButtonEvents;
  if (!(events instanceof Map)) {
    return 0;
  }
  const remaining = Number(events.get(name)) || 0;
  if (remaining <= 0) {
    events.delete(name);
    return 0;
  }
  events.set(name, remaining - 1);
  return 1;
}

function nodeGraphWireBreakEventSample(runtime) {
  const event = runtime?.wireBreakEvent;
  if (!event || typeof event !== "object") {
    return { Pulse: 0, Gate: 0 };
  }
  const pulseSamples = Math.max(0, Number(event.pulseSamples) || 0);
  const gateSamples = Math.max(0, Number(event.gateSamples) || 0);
  const output = {
    Pulse: pulseSamples > 0 ? 1 : 0,
    Gate: gateSamples > 0 ? 1 : 0,
  };
  event.pulseSamples = Math.max(0, pulseSamples - 1);
  event.gateSamples = Math.max(0, gateSamples - 1);
  return output;
}

function nodeGraphWireDisconnectEventSample(runtime) {
  const event = runtime?.wireDisconnectEvent;
  if (!event || typeof event !== "object") {
    return { Pulse: 0 };
  }
  const pulseSamples = Math.max(0, Number(event.pulseSamples) || 0);
  event.pulseSamples = Math.max(0, pulseSamples - 1);
  return { Pulse: pulseSamples > 0 ? 1 : 0 };
}

function nodeGraphWireConnectEventSample(runtime) {
  const event = runtime?.wireConnectEvent;
  if (!event || typeof event !== "object") {
    return { Pulse: 0 };
  }
  const pulseSamples = Math.max(0, Number(event.pulseSamples) || 0);
  event.pulseSamples = Math.max(0, pulseSamples - 1);
  return { Pulse: pulseSamples > 0 ? 1 : 0 };
}

function nodeGraphShootingStarExplosionEventSample(runtime, lowRange, highRange) {
  const event = runtime?.shootingStarExplosionEvent;
  if (!event || typeof event !== "object") {
    return { Pulse: 0 };
  }
  const pulseSamples = Math.max(0, Number(event.pulseSamples) || 0);
  const speed = Number(event.speed);
  const low = Number(lowRange) || 0;
  const high = Number(highRange) || 0;
  const lo = Math.min(low, high);
  const hi = Math.max(low, high);
  // speed is expected 0-1 (the site's trigger intensity), interpolated
  // linearly into [lowRange, highRange] to get the actual pulse amplitude.
  // No speed data (not finite) keeps the pulse at max amplitude.
  let power = hi;
  if (Number.isFinite(speed)) {
    const normalizedSpeed = Math.max(0, Math.min(1, speed));
    power = lo + normalizedSpeed * (hi - lo);
  }
  event.pulseSamples = Math.max(0, pulseSamples - 1);
  return { Pulse: pulseSamples > 0 ? power : 0 };
}

function nodeGraphWindowReopenEventSample(runtime) {
  const event = runtime?.windowReopenEvent;
  if (!event || typeof event !== "object") {
    return { Pulse: 0, Gate: 0, Sine: 0 };
  }
  const pulseSamples = Math.max(0, Number(event.pulseSamples) || 0);
  const gateSamples = Math.max(0, Number(event.gateSamples) || 0);
  const totalSamples = Math.max(1, Number(event.totalSamples) || gateSamples || 1);
  const progress = gateSamples > 0 ? 1 - gateSamples / totalSamples : 1;
  const sine = gateSamples > 0 ? Math.sin(Math.PI * Math.max(0, Math.min(1, progress))) : 0;
  event.pulseSamples = Math.max(0, pulseSamples - 1);
  event.gateSamples = Math.max(0, gateSamples - 1);
  return {
    Pulse: pulseSamples > 0 ? 1 : 0,
    Gate: gateSamples > 0 ? 1 : 0,
    Sine: sine,
  };
}

function createNodeGraphPatchCommandState() {
  return {
    lastTrigger: 0,
  };
}

function nodeGraphPatchCommandTriggerSample(state, trigger, threshold, command, nodeId) {
  const safeTrigger = Number.isFinite(Number(trigger)) ? Number(trigger) : 0;
  const safeThreshold = Number.isFinite(Number(threshold)) ? Number(threshold) : 0;
  if (state.lastTrigger <= safeThreshold && safeTrigger > safeThreshold) {
    if (typeof queueNodeGraphLivePatchCommand === "function") {
      queueNodeGraphLivePatchCommand(command, nodeId);
    }
  }
  state.lastTrigger = safeTrigger;
  return 0;
}

function createNodeGraphLowpassState() {
  return {
    outputBuffer: 0,
  };
}

function createNodeGraphPassiveFilterState() {
  return {
    highpass: createNodeGraphHighpassState(),
    lowpass: createNodeGraphLowpassState(),
  };
}

function nodeGraphPassiveFilterSample(state, input, mode, lowFrequency, highFrequency, sampleRate, runtime, nodeId) {
  const safeMode = Math.round(Number(mode)) || 0;
  if (safeMode === 1) {
    const lowCut  = Math.max(0, Number(lowFrequency)  || 0);
    const highCut = Math.max(0, Number(highFrequency) || 0);
    const low  = Math.min(lowCut, highCut);
    const high = Math.max(lowCut, highCut);
    const hp = nodeGraphOnePoleHighpassSample(state.highpass, input, low, sampleRate, runtime, nodeId);
    return nodeGraphOnePoleLowpassSample(state.lowpass, hp, high, sampleRate, runtime, nodeId);
  }
  if (safeMode === 2) {
    return nodeGraphOnePoleHighpassSample(state.highpass, input, lowFrequency, sampleRate, runtime, nodeId);
  }
  return nodeGraphOnePoleLowpassSample(state.lowpass, input, highFrequency, sampleRate, runtime, nodeId);
}

function createNodeGraphLadderFilterState() {
  return {
    y: [0, 0, 0, 0, 0],
  };
}

function createNodeGraphOscResetState() {
  return {
    lastReset: 0,
  };
}

function nodeGraphIsPolyBlepOscillatorType(type) {
  return nodeGraphModuleIsRealtimeOscillatorType(type);
}

function createNodeGraphGraphLfoState() {
  return {
    lastReset: 0,
    resetFrame: 0,
  };
}

function createNodeGraphFlowerChildFilterState() {
  return {
    phase: 0, phaseOffset: 0, stage1: 0, stage2: 0, selfMod: 0,
    rev3Feedback: 0, rev3Lpf1Y1: 0, rev3Lpf2Y1: 0,
    dsPhase: 0, dsHeld: 0,
  };
}

function nodeGraphFlowerChildFilterEvalGraph(nodes, x) {
  if (nodes.length === 0) return 0;
  if (x < nodes[0].x) return nodes[0].y;
  let i = -1;
  for (let k = 0; k < nodes.length; k++) {
    if (nodes[k].x > x) { i = k; break; }
  }
  if (i < 0) return nodes[nodes.length - 1].y;
  if (i === 0) return nodes[0].y;
  const n1 = nodes[i - 1];
  const n2 = nodes[i];
  if (n2.x - n1.x < 1e-9) return 0.5 * (n1.y + n2.y);
  const p = (x - n1.x) / (n2.x - n1.x);
  if (n2.shape === 1) return n1.y + (n2.y - n1.y) * nodeGraphFlowerChildFilterRationalCurve(p, n2.skew);
  if (n2.shape === 2) {
    const c = 0.5 * (n2.skew + 1);
    const a = 2 * Math.log((1 - c) / c);
    return n1.y + (n2.y - n1.y) * (1 - Math.exp(p * a)) / (1 - Math.exp(a));
  }
  return n1.y + (n2.y - n1.y) * p;
}

function nodeGraphFlowerChildFilterOnePoleIitCoefficient(cutoffHz, sampleRate) {
  const w = Math.max(1e-9, Math.min(Math.PI * 0.98, 2 * Math.PI * cutoffHz / sampleRate));
  return Math.exp(-w);
}

function nodeGraphFlowerChildFilterOnePoleIitStep(prevY1, input, a1) {
  const b0 = 1 - a1;
  return b0 * input + a1 * prevY1;
}

function nodeGraphFlowerChildFilterSampleAndHold(state, incoming, samplingFreq, sampleRate) {
  state.dsPhase += samplingFreq / sampleRate;
  if (state.dsPhase >= 1) {
    state.dsPhase -= Math.floor(state.dsPhase);
    state.dsHeld = incoming;
  }
  return state.dsHeld;
}

function nodeGraphFlowerChildFilterCurveShape(v, tension) {
  const denom = 2 * tension * v - tension - 1;
  if (denom === 0) return v;
  return (tension * v - v) / denom;
}

function nodeGraphFlowerChildFilterRationalCurve(p, skew) {
  return ((1 + skew) * p) / (1 - skew + 2 * skew * p);
}

function nodeGraphFlowerChildFilterEvalResonanceGraph(x, n0y, breakpoint, n2y, skew) {
  if (x < 0) return n0y;
  if (x >= 1) return n2y;
  if (x < breakpoint) return n0y;
  const p = (x - breakpoint) / (1 - breakpoint);
  return n0y + (n2y - n0y) * nodeGraphFlowerChildFilterRationalCurve(p, skew);
}

function nodeGraphFlowerChildFilterOnePoleCoefficient(cutoffHz, sampleRate) {
  const rawWc = 2 * Math.PI * cutoffHz / sampleRate;
  const wc = Math.max(1e-9, Math.min(Math.PI * 0.98, rawWc));
  const s = Math.sin(wc);
  const c = Math.cos(wc);
  const t = Math.tan(0.25 * (wc - Math.PI));
  let denom = s - c * t;
  if (denom > -1e-12 && denom < 1e-12) denom = denom >= 0 ? 1e-12 : -1e-12;
  return t / denom;
}

function nodeGraphFlowerChildFilterOnePoleStep(prevY1, input, a) {
  let y0 = input;
  y0 = y0 / (1 + y0 * y0);
  return y0 + a * (y0 - prevY1);
}

function nodeGraphFlowerChildFilterEllipse(phase, ellipseC) {
  const sinX = Math.sin(phase * 2 * Math.PI);
  const cosX = Math.cos(phase * 2 * Math.PI);
  let sqrtVal = Math.sqrt(cosX * cosX + (ellipseC * sinX) * (ellipseC * sinX));
  if (sqrtVal < 1e-12) sqrtVal = 1e-12;
  return cosX / sqrtVal;
}

function nodeGraphFlowerChildFilterSample(state, input, params, sampleRate, runtime = null, nodeId = "") {
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const freqNorm = Math.max(0, Math.min(1, Number(params.frequency) || 0));
  const reso = Math.max(0, Math.min(1, Number(params.resonance) || 0));
  const modeNum = Math.round(Number(params.mode) || 0);

  if (modeNum === 2) {
    const masterPitch = -120 + (105 - -120) * freqNorm;
    const masterFrequency = 440 * Math.pow(2, (masterPitch - 69) / 12);
    const fmAmount = 440 * Math.pow(2, (-48.377 - 69) / 12);
    const lpf1Cutoff = 440 * Math.pow(2, ((90 + (180 - 90) * (masterPitch - -120) / (120 - -120)) - 69) / 12);
    const lpf2Cutoff = 440 * Math.pow(2, ((80 + (130 - 80) * (masterPitch - -120) / (120 - -120)) - 69) / 12);
    const lpf1A = nodeGraphFlowerChildFilterOnePoleIitCoefficient(lpf1Cutoff, rate);
    const lpf2A = nodeGraphFlowerChildFilterOnePoleIitCoefficient(lpf2Cutoff, rate);

    const phaseModGraph = [{x:0,y:0.0,skew:0,shape:0},{x:0.5,y:-0.017446,skew:0.9,shape:1},{x:0.6,y:-0.017575,skew:0.0,shape:1},{x:1.0,y:-0.0147,skew:0.6,shape:1}];
    const sineAmpGraph = [{x:0,y:4.44777,skew:0,shape:0},{x:0.5,y:8.6687,skew:0.9,shape:1},{x:0.6,y:8.6687,skew:0.0,shape:1},{x:1.0,y:2.0,skew:0.6,shape:1}];
    const sineToSquareGraph = [{x:0,y:0.6792,skew:0,shape:0},{x:0.5,y:0.9552,skew:0.9,shape:1},{x:0.6,y:0.9552,skew:0.0,shape:1},{x:1.0,y:0.001,skew:0.6,shape:1}];
    const clipLevelGraph = [{x:0.0,y:7.0,skew:0,shape:0},{x:0.7,y:7.0,skew:0.0,shape:1},{x:1.0,y:2.0,skew:0.6,shape:1}];

    const pmAmount = nodeGraphFlowerChildFilterEvalGraph(phaseModGraph, reso);
    const sineAmp = nodeGraphFlowerChildFilterEvalGraph(sineAmpGraph, reso);
    const sineToSquare = nodeGraphFlowerChildFilterEvalGraph(sineToSquareGraph, reso);
    const clipLevelRaw = nodeGraphFlowerChildFilterEvalGraph(clipLevelGraph, reso);
    const clipLevel = Math.min(sineAmp, clipLevelRaw);

    const safeInput = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "flower child rev3 input");
    const inSig = state.rev3Feedback + Math.max(-clipLevel, Math.min(clipLevel, -1 * safeInput));
    const f = masterFrequency * inSig * fmAmount;

    state.phase = state.phase + f / rate;
    state.phase = state.phase - Math.floor(state.phase);
    const bipolarPhasor = 2 * state.phase - 1;
    const phasorOut = bipolarPhasor + pmAmount * state.rev3Feedback;

    const ellipseOut = sineAmp * nodeGraphFlowerChildFilterEllipse(phasorOut, sineToSquare);

    let feedback = nodeGraphFlowerChildFilterOnePoleIitStep(state.rev3Lpf1Y1, ellipseOut, lpf1A);
    state.rev3Lpf1Y1 = feedback;
    feedback = nodeGraphFlowerChildFilterOnePoleIitStep(state.rev3Lpf2Y1, feedback, lpf2A);
    state.rev3Lpf2Y1 = feedback;
    state.rev3Feedback = feedback;

    return nodeGraphSafeFilterNumber(feedback * 0.15, runtime, nodeId, state, "flower child rev3 output");
  }

  if (modeNum === 3) {
    const maxNormFreq3 = rate <= 44100 ? 0.928 : 1;
    const normalizedFreqInUse3 = Math.min(freqNorm, maxNormFreq3) * (161 - 3) + 3;
    const frequencyHz3 = 440 * Math.pow(2, (normalizedFreqInUse3 - 69) / 12);

    const cutoff1 = frequencyHz3 * 0.4;
    const a1 = nodeGraphFlowerChildFilterOnePoleCoefficient(cutoff1, rate);

    let breakpoint, cap;
    if (rate <= 44100) { breakpoint = 0.732441; cap = 0.649123; }
    else if (rate <= 88200) { breakpoint = 0.816054; cap = 0.818713; }
    else { breakpoint = 0.879599; cap = 0.807018; }
    const cappedTarget = Math.min(reso, cap);
    const graphValue = nodeGraphFlowerChildFilterEvalResonanceGraph(reso, reso, breakpoint, cappedTarget, -0.38);
    const selfModAmp = 0.0368 + (0.6333 - 0.0368) * nodeGraphFlowerChildFilterCurveShape(graphValue, 0.4);

    const safeInput = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "flower child downsampled input");
    let inputSignal = Math.max(-1, Math.min(1, -safeInput)) * 0.036;
    inputSignal += state.selfMod;

    const mod = 1.4 * inputSignal;
    const fm = mod;

    state.phase = state.phase + (frequencyHz3 * fm * 6.0) / rate;
    state.phase = state.phase - Math.floor(state.phase);

    const dsf = [{x:0,y:0,skew:0,shape:0},{x:1,y:0.025*rate,skew:-0.09,shape:2}];
    const samplingFreq = frequencyHz3 * 2.0 + nodeGraphFlowerChildFilterEvalGraph(dsf, 10.0 * Math.abs(mod));

    const downsampledPhase = nodeGraphFlowerChildFilterSampleAndHold(state, state.phase, samplingFreq, rate);
    const current_osc_value = Math.sin(downsampledPhase * 2 * Math.PI) * 1.3;

    const filtered = nodeGraphFlowerChildFilterOnePoleStep(state.stage1, current_osc_value, a1);
    state.stage1 = filtered;
    state.selfMod = filtered * selfModAmp;

    return nodeGraphSafeFilterNumber(filtered * 1.4, runtime, nodeId, state, "flower child downsampled output");
  }

  const dirty = modeNum !== 0;

  const maxNormFreq = rate <= 44100 ? 0.928 : 1;
  const normalizedFreqInUse = (Math.min(freqNorm, maxNormFreq)) * (161 - 3) + 3;
  const frequencyHz = 440 * Math.pow(2, (normalizedFreqInUse - 69) / 12);

  const cutoff1 = frequencyHz * 0.164312;
  const cutoff2 = frequencyHz * 0.366131;
  const a1 = nodeGraphFlowerChildFilterOnePoleCoefficient(cutoff1, rate);
  const a2 = nodeGraphFlowerChildFilterOnePoleCoefficient(cutoff2, rate);

  let breakpoint, cap;
  if (dirty) {
    if (rate <= 44100) { breakpoint = 0.816054; cap = 0.602339; }
    else if (rate <= 88200) { breakpoint = 0.902657; cap = 0.654971; }
    else { breakpoint = 0.977649; cap = 0.760234; }
  } else {
    if (rate <= 44100) { breakpoint = 0.732441; cap = 0.649123; }
    else if (rate <= 88200) { breakpoint = 0.816054; cap = 0.818713; }
    else { breakpoint = 0.879599; cap = 0.807018; }
  }
  const cappedTarget = Math.min(reso, cap);

  let selfModAmp = 1;
  let ellipseC = -1;
  if (!dirty) {
    const graphValue = nodeGraphFlowerChildFilterEvalResonanceGraph(reso, reso, breakpoint, cappedTarget, -0.38);
    selfModAmp = 0.0368 + (0.6333 - 0.0368) * nodeGraphFlowerChildFilterCurveShape(graphValue, 0.4);
  } else {
    const graphValue = nodeGraphFlowerChildFilterEvalResonanceGraph(freqNorm, reso, breakpoint, cappedTarget, -0.38);
    ellipseC = -1 + (0.00001 - -1) * nodeGraphFlowerChildFilterCurveShape(graphValue, -0.6);
  }

  const clampLimit = dirty ? 1.198 : 1;
  const safeInput = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "flower child input");
  let inputSignal = Math.max(-clampLimit, Math.min(clampLimit, -safeInput));

  inputSignal = state.selfMod + 0.035848699999999845 * inputSignal;

  const mod = 1.4 * inputSignal;
  const fm = mod;

  state.phaseOffset = 0;
  const incAmt = (frequencyHz * fm) / rate;
  state.phase = state.phase + incAmt;
  state.phase = state.phase - Math.floor(state.phase);
  let unipolarPhase = state.phase + state.phaseOffset;
  unipolarPhase = unipolarPhase - Math.floor(unipolarPhase);

  const oscValue = dirty
    ? nodeGraphFlowerChildFilterEllipse(unipolarPhase, ellipseC) * 0.1
    : Math.sin(unipolarPhase * 2 * Math.PI) * 1.3;

  let out = nodeGraphFlowerChildFilterOnePoleStep(state.stage1, oscValue, a1);
  state.stage1 = out;
  out = nodeGraphFlowerChildFilterOnePoleStep(state.stage2, out, a2);
  state.stage2 = out;

  state.selfMod = dirty ? out * 0.465 : out * selfModAmp;

  const output = dirty ? out * 5.22 : out * 1.31;
  return nodeGraphSafeFilterNumber(output, runtime, nodeId, state, "flower child output");
}

function createNodeGraphResonatorFilterState() {
  return {
    phase1: 0, phase2: 0, filterY: [0,0,0,0,0], dcY: [0,0,0,0,0],
    osc1Value: 0, osc2Value: 0, osc1SelfMod: 0, osc2SelfMod: 0, sawFeedback: 0,
  };
}

function nodeGraphResonatorFilterSample(state, input, params, sampleRate, runtime = null, nodeId = "") {
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const freqNorm = Math.max(0, Math.min(1, Number(params.frequency) || 0));
  const reso = Math.max(0, Math.min(1, Number(params.resonance) || 0));
  const chaos = Math.max(0, Math.min(1, Number(params.chaos) || 0));
  const mode = Math.max(0, Math.min(2, Math.round(Number(params.mode) || 0)));
  const safeInput = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "resonator input");

  if (mode === 0 || mode === 1) {
    const triangle = mode === 1;
    const inputAmplitude = triangle ? 3.0 : 2.0;

    let maxFreqNorm, resDropPoint;
    if (rate <= 44100) { maxFreqNorm = 0.855; resDropPoint = 0.74; }
    else if (rate <= 88200) { maxFreqNorm = 0.9; resDropPoint = 0.75; }
    else if (rate <= 132300) { maxFreqNorm = 0.9; resDropPoint = 0.82; }
    else if (rate <= 176400) { maxFreqNorm = 0.9; resDropPoint = 0.88; }
    else if (rate <= 220500) { maxFreqNorm = 0.9; resDropPoint = 0.92; }
    else { maxFreqNorm = 0.955; resDropPoint = 0.92; }

    const freqNormInUse = Math.min(freqNorm, maxFreqNorm);
    const frequencyHz = nodeGraphAnalogPitchToFreq(-72.96 + (69.76 - -72.96) * freqNormInUse);
    const cutoffHz = frequencyHz * (0.248387 + (0.0927813 - 0.248387) * nodeGraphFlowerChildFilterCurveShape(freqNormInUse, -0.36));
    const osc2Ratio = 0.015625 + (1.58 - 0.015625) * freqNormInUse;
    const osc1Ratio = osc2Ratio - 0.015625;

    const resGraph = [{x:0,y:reso,skew:0,shape:0},{x:resDropPoint,y:reso,skew:0,shape:0},{x:1,y:0.15,skew:0.557,shape:1}];
    const newResNorm = nodeGraphAnalogEvalGraph(resGraph, freqNorm);
    const freqModAmt = 10.0 + (484.43 - 10.0) * newResNorm;
    const phaseModAmt = 0.256 + (0.166 - 0.256) * chaos;

    let inputSignal = inputAmplitude * safeInput;
    inputSignal = state.osc2Value + state.osc1SelfMod + inputSignal;

    const freq1 = frequencyHz * osc1Ratio * freqModAmt * 0.1 * inputSignal;
    const clampedFreq1 = Math.max(-rate * 0.5, Math.min(rate * 0.5, freq1));
    state.phase1 += clampedFreq1 / rate;
    state.phase1 -= Math.floor(state.phase1);
    const phaseOffset1 = inputSignal * phaseModAmt;
    let unipolar1 = state.phase1 + phaseOffset1;
    unipolar1 -= Math.floor(unipolar1);
    state.osc1Value = nodeGraphAnalogWaveEllipse(unipolar1, 0.00749) * 0.5;

    const a = nodeGraphAnalogLadderCoefficient(cutoffHz, rate);
    inputSignal = nodeGraphAnalogLadderTapStep(state.filterY, state.osc1Value, a, 1, 1);

    state.osc1SelfMod = inputSignal;
    state.osc2SelfMod = state.osc2Value;

    const fm2 = freqModAmt * 4.53126 * inputSignal + state.osc2SelfMod * 3.0;
    const freq2 = frequencyHz * osc2Ratio * fm2;
    const clampedFreq2 = Math.max(-rate * 0.5, Math.min(rate * 0.5, freq2));
    state.phase2 += clampedFreq2 / rate;
    state.phase2 -= Math.floor(state.phase2);

    let out;
    if (!triangle) {
      out = Math.sin(state.phase2 * 2 * Math.PI);
      state.osc2Value = out * 10.0;
    } else {
      const ellipseCGraph = [{x:0,y:0.3,skew:0,shape:0},{x:1,y:1.0,skew:-0.99,shape:2}];
      const ellipseC = nodeGraphAnalogEvalGraph(ellipseCGraph, freqNormInUse);
      out = nodeGraphAnalogWaveEllipse(state.phase2, ellipseC);
      state.osc2Value = out * 10.0;
    }

    const dcA = nodeGraphAnalogLadderCoefficient(5.0, rate);
    const dcOut = nodeGraphAnalogLadderTapStep(state.dcY, -out, dcA, 2, 1);
    return nodeGraphSafeFilterNumber(dcOut * (triangle ? 10.0 : 4.6), runtime, nodeId, state, "resonator sinusoid/triangle output");
  } else {
    const inputAmplitude = 2.0;
    const frequencyHz = nodeGraphAnalogPitchToFreq(-50 + (108 - -50) * freqNorm);
    const cutoffHz = frequencyHz * 8.87718;

    const mod21Graph = [{x:0,y:-0.00105655,skew:0,shape:0},{x:1,y:-2.52898,skew:-0.99,shape:2}];
    const fmpm12Graph = [{x:0,y:0.0,skew:0,shape:0},{x:1,y:0.012216,skew:0.54,shape:2}];

    let breakpoint2, cap3;
    if (rate <= 44100) { breakpoint2 = 0.578595; cap3 = 0.432749; }
    else if (rate <= 88200) { breakpoint2 = 0.692308; cap3 = 0.502924; }
    else if (rate <= 132300) { breakpoint2 = 0.749164; cap3 = 0.561404; }
    else { breakpoint2 = 0.776273; cap3 = 0.54386; }
    const cappedTarget = Math.min(reso, cap3);
    const resGraph = [{x:0,y:0,skew:0,shape:0},{x:0.0434783,y:reso,skew:0,shape:0},{x:breakpoint2,y:reso,skew:0,shape:0},{x:1,y:cappedTarget,skew:0.195211,shape:1}];
    const resSample = nodeGraphAnalogEvalGraph(resGraph, freqNorm);
    let mod21 = nodeGraphAnalogEvalGraph(mod21Graph, resSample);
    if (mod21 < -1.53) mod21 = -1.53;
    const fmpm12 = nodeGraphAnalogEvalGraph(fmpm12Graph, chaos);

    let inputSignal = (-safeInput) * inputAmplitude + state.sawFeedback * -8.07896613446314289533 + state.osc2Value + state.osc1SelfMod * 20.0;

    const freq1 = frequencyHz * mod21 * inputSignal;
    state.phase1 += freq1 / rate;
    state.phase1 -= Math.floor(state.phase1);
    state.osc1Value = Math.sin(state.phase1 * 2 * Math.PI);
    // rsScaledAndShiftedSigmoid, center=0, width=0.00873698
    const scaleX = 2 / 0.00873698;
    state.osc1Value = (0.00873698 / 2) * Math.tanh(scaleX * state.osc1Value);

    const a = nodeGraphAnalogLadderCoefficient(cutoffHz, rate);
    inputSignal = nodeGraphAnalogLadderTapStep(state.filterY, state.osc1Value, a, 1, 1);

    state.osc1SelfMod = inputSignal;
    state.osc2SelfMod = state.osc2Value;

    const modv = inputSignal * -140.010789331 + state.osc2SelfMod * -1.05208;
    const fm = Math.cos((Math.PI / 2) * fmpm12) * modv;
    const pm = Math.sin((Math.PI / 2) * fmpm12) * modv;
    state.phase2 += (frequencyHz * (-0.425 + fm)) / rate;
    state.phase2 -= Math.floor(state.phase2);
    let unipolar2 = state.phase2 + pm;
    unipolar2 -= Math.floor(unipolar2);
    state.osc2Value = Math.sin(unipolar2 * 2 * Math.PI);

    state.sawFeedback = inputSignal + state.osc2Value;

    const dcA = nodeGraphAnalogLadderCoefficient(5.0, rate);
    const dcOut = nodeGraphAnalogLadderTapStep(state.dcY, -state.osc2Value * 0.1, dcA, 2, 1);
    return nodeGraphSafeFilterNumber(dcOut * 80.0, runtime, nodeId, state, "resonator sawtooth output");
  }
}

// --- Human Filter ---

function createNodeGraphHumanFilterState() {
  return {
    phase1: 0, phase2: 0, osc1Value: 0, osc2Value: 0, lastOutValue: 0,
    osc1ModSelf: 0, osc2ModSelf: 0, fbZ1: 0, fbZ2: 0, dcY: [0,0,0,0,0],
  };
}

function nodeGraphHumanFilterDbToAmp(db) {
  return Math.pow(10, db / 20);
}

function nodeGraphHumanFilterSample(state, input, params, sampleRate, runtime = null, nodeId = "") {
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const freqNorm = Math.max(0, Math.min(1, Number(params.frequency) || 0));
  const reso = Math.max(0, Math.min(1, Number(params.resonance) || 0));
  const chaos = Math.max(0, Math.min(1, Number(params.chaos) || 0));
  const mode = Math.max(0, Math.min(2, Math.round(Number(params.mode) || 0)));

  let maxPitch, resDropPoint, chaosMax;
  if (rate <= 44100) { maxPitch = 115.57; resDropPoint = 0.78; chaosMax = 0.64; }
  else if (rate <= 88200) { maxPitch = 128.7; resDropPoint = 0.78; chaosMax = 1.0; }
  else if (rate <= 132300) { maxPitch = 137.0; resDropPoint = 0.83; chaosMax = 0.856; }
  else if (rate <= 176400) { maxPitch = 137.0; resDropPoint = 0.91; chaosMax = 1.0; }
  else if (rate <= 220500) { maxPitch = 137.0; resDropPoint = 1.0; chaosMax = 1.0; }
  else { maxPitch = 137.0; resDropPoint = 0.78; chaosMax = 1.0; }

  const pitch = -0.38 + (137.0 - -0.38) * freqNorm;
  const frequencyHz = nodeGraphAnalogPitchToFreq(Math.min(pitch, maxPitch));

  const mod11Graph = [{x:0.0,y:2.92396,skew:0,shape:0},{x:1.0,y:-1.7544,skew:0.785442,shape:1}];
  let mod11;
  if (resDropPoint !== 1.0) {
    const resVfreqGraph = [{x:0.0,y:reso,skew:0,shape:0},{x:resDropPoint,y:reso,skew:0,shape:0},{x:1.0,y:0.2,skew:0.57,shape:1}];
    const newResNormalized = nodeGraphAnalogEvalGraph(resVfreqGraph, freqNorm);
    mod11 = nodeGraphAnalogEvalGraph(mod11Graph, newResNormalized);
  } else {
    mod11 = nodeGraphAnalogEvalGraph(mod11Graph, reso);
  }

  const gainDb = Math.min(chaos, chaosMax) * 14.9;

  const centerHz = 1000.0;
  const Q = 1.0;
  const A = nodeGraphHumanFilterDbToAmp(gainDb);
  const w = Math.max(1e-9, Math.min(Math.PI * 0.98, 2 * Math.PI * centerHz / rate));
  const r = 1 / (Q * A);
  const g = Math.tan(0.5 * w);
  const c = g + r;
  const sCoef = 1 / (1 + g * c);
  const aB = A * A * r;

  const safeInput = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "human input");
  const clampedInput = Math.max(-2, Math.min(2, safeInput));
  const svfIn = state.osc2Value + state.osc1ModSelf + clampedInput + state.lastOutValue;
  const yH = (svfIn - c * state.fbZ1 - state.fbZ2) * sCoef;
  const yB = state.fbZ1 + g * yH;
  const yL = state.fbZ2 + g * yB;
  state.fbZ1 = 2 * yB - state.fbZ1;
  state.fbZ2 = 2 * yL - state.fbZ2;
  const inputSignal = yH + aB * yB + yL;

  const fm1 = -2.2784975504539248 * inputSignal;
  state.phase1 += (frequencyHz * fm1) / rate;
  state.phase1 -= Math.floor(state.phase1);
  state.osc1Value = Math.sin(state.phase1 * 2 * Math.PI) * 0.177898;

  state.osc1ModSelf = state.osc1Value * mod11;
  state.osc2ModSelf = state.osc2Value * -0.395833;

  const fm2 = 0.0333333 + 2.7429968062 * state.osc1Value + state.osc2ModSelf;
  state.phase2 += (frequencyHz * fm2) / rate;
  state.phase2 -= Math.floor(state.phase2);
  state.osc2Value = Math.sin(state.phase2 * 2 * Math.PI) * 0.71597;

  state.lastOutValue = (state.osc1Value + state.osc2Value) * 0.1443178;

  const dcA = nodeGraphAnalogLadderCoefficient(5.0, rate);
  let out;
  if (mode === 0) out = nodeGraphAnalogLadderTapStep(state.dcY, state.osc1Value, dcA, 2, 1) * 2.0;
  else if (mode === 1) out = nodeGraphAnalogLadderTapStep(state.dcY, state.osc1Value + state.osc2Value, dcA, 2, 1);
  else out = nodeGraphAnalogLadderTapStep(state.dcY, state.osc2Value, dcA, 2, 1);

  return nodeGraphSafeFilterNumber(out, runtime, nodeId, state, "human output");
}

// Shared helpers for the RSMET/Yellowjacket/SuperLove/ChaoticPhaseLocking/
// Resonator/Human filter family below -- mirrors each native module's C++
// exactly (same math, JS built-ins standing in for the freestanding
// polynomial approximations, which is fine offline where Math.sin/cos/tan
// are already available). Ingested from soemdsp-sandbox master.

function nodeGraphAnalogLadderTapStep(y, input, a, mode, stages) {
  const c = [0, 0, 0, 0, 0];
  if (mode === 1) {
    c[stages] = 1;
  } else if (mode === 2) {
    const hp = [[1, -1, 0, 0, 0], [1, -2, 1, 0, 0], [1, -3, 3, -1, 0], [1, -4, 6, -4, 1]];
    for (let i = 0; i <= stages; i++) c[i] = hp[stages - 1][i];
  } else if (mode === 3) {
    const bp = [[0, 2, -2, 0, 0], [0, 2, -2, 0, 0], [0, 0, 3, -3, 0], [0, 0, 4, -8, 4]];
    for (let i = 0; i < 5; i++) c[i] = bp[stages - 1][i];
  }
  let y0 = input;
  y0 = y0 / (1 + y0 * y0);
  y[1] = y0 + a * (y0 - y[1]);
  y[2] = y[1] + a * (y[1] - y[2]);
  y[3] = y[2] + a * (y[2] - y[3]);
  y[4] = y[3] + a * (y[3] - y[4]);
  y[0] = y0;
  return c[0] * y[0] + c[1] * y[1] + c[2] * y[2] + c[3] * y[3] + c[4] * y[4];
}

function nodeGraphAnalogLadderCoefficient(cutoffHz, sampleRate) {
  const wc = Math.max(1e-9, Math.min(Math.PI * 0.98, 2 * Math.PI * cutoffHz / sampleRate));
  const s = Math.sin(wc);
  const c = Math.cos(wc);
  const t = Math.tan(0.25 * (wc - Math.PI));
  let denom = s - c * t;
  if (denom > -1e-12 && denom < 1e-12) denom = denom >= 0 ? 1e-12 : -1e-12;
  return t / denom;
}

function nodeGraphAnalogRationalCurve(p, skew) {
  return ((1 + skew) * p) / (1 - skew + 2 * skew * p);
}

function nodeGraphAnalogEvalGraph(nodes, x) {
  if (nodes.length === 0) return 0;
  if (x < nodes[0].x) return nodes[0].y;
  let i = -1;
  for (let k = 0; k < nodes.length; k++) {
    if (nodes[k].x > x) { i = k; break; }
  }
  if (i < 0) return nodes[nodes.length - 1].y;
  if (i === 0) return nodes[0].y;
  const n1 = nodes[i - 1];
  const n2 = nodes[i];
  if (n2.x - n1.x < 1e-9) return 0.5 * (n1.y + n2.y);
  const p = (x - n1.x) / (n2.x - n1.x);
  if (n2.shape === 1) return n1.y + (n2.y - n1.y) * nodeGraphAnalogRationalCurve(p, n2.skew);
  if (n2.shape === 2) {
    const c = 0.5 * (n2.skew + 1);
    const a = 2 * Math.log((1 - c) / c);
    return n1.y + (n2.y - n1.y) * (1 - Math.exp(p * a)) / (1 - Math.exp(a));
  }
  return n1.y + (n2.y - n1.y) * p;
}

function nodeGraphAnalogWaveEllipseFull(phaseCycles, A, bSin, bCos, C) {
  const sinX = Math.sin(phaseCycles * 2 * Math.PI);
  const cosX = Math.cos(phaseCycles * 2 * Math.PI);
  const apc = A + cosX;
  let sqrtVal = Math.sqrt(apc * apc + (C * sinX) * (C * sinX));
  if (sqrtVal < 1e-12) sqrtVal = 1e-12;
  return (apc * bCos + (C * sinX) * bSin) / sqrtVal;
}

function nodeGraphAnalogWaveEllipse(phaseCycles, ellipseC) {
  return nodeGraphAnalogWaveEllipseFull(phaseCycles, 0, 0, 1, ellipseC);
}

function nodeGraphAnalogWaveTrisaw(phaseCycles, morph) {
  let phaseRad = phaseCycles * 2 * Math.PI;
  phaseRad = phaseRad - 2 * Math.PI * Math.floor(phaseRad / (2 * Math.PI));
  const morphRad = morph * 2 * Math.PI;
  let sourceMin, sourceMax, targetMin, targetRange;
  if (phaseRad > morphRad) {
    sourceMin = morphRad; sourceMax = 2 * Math.PI; targetMin = 1; targetRange = -1;
  } else {
    sourceMin = 0; sourceMax = morphRad; targetMin = 0; targetRange = 1;
  }
  const sourceRange = sourceMax - sourceMin;
  let uni;
  if (sourceMin === sourceMax) uni = sourceMin;
  else uni = targetMin + (targetRange * (phaseRad - sourceMin)) / sourceRange;
  return 2 * uni - 1;
}

function nodeGraphAnalogPitchToFreq(pitch) {
  return 440 * Math.pow(2, (pitch - 69) / 12);
}

function nodeGraphAnalogNextNoiseBipolar() {
  return Math.random() * 2 - 1;
}

// --- Change Detector ---

function createNodeGraphChangeDetectorState() {
  return { lastValue: 0 };
}

function nodeGraphChangeDetectorSample(state, input, runtime = null, nodeId = "") {
  const safeInput = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "change detector input");
  let up = 0, same = 0, down = 0, changed = 0;
  if (safeInput > state.lastValue) {
    up = 1;
    changed = 1;
  } else if (safeInput < state.lastValue) {
    down = 1;
    changed = 1;
  } else {
    same = 1;
  }
  state.lastValue = safeInput;
  return { up, same, down, changed };
}

// --- Yellowjacket Filter ---

function createNodeGraphYellowjacketFilterState() {
  return { phase: 0, filterY1: 0, oscSelfMod: 0, lastOutValue: 0 };
}

function nodeGraphYellowjacketFilterSample(state, input, params, sampleRate, runtime = null, nodeId = "") {
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const freqNorm = Math.max(0, Math.min(1, Number(params.frequency) || 0));
  const reso = Math.max(0, Math.min(1, Number(params.resonance) || 0));
  const chaos = Math.max(0, Math.min(1, Number(params.chaos) || 0));

  let maxPitch, resDropPoint;
  if (rate <= 44100) { maxPitch = 87.7; resDropPoint = 0.77; }
  else if (rate <= 88200) { maxPitch = 96.0; resDropPoint = 0.82; }
  else if (rate <= 132300) { maxPitch = 96.0; resDropPoint = 0.83; }
  else if (rate <= 176400) { maxPitch = 96.0; resDropPoint = 0.86; }
  else if (rate <= 220500) { maxPitch = 96.0; resDropPoint = 0.89; }
  else if (rate <= 264600) { maxPitch = 96.0; resDropPoint = 0.90; }
  else { maxPitch = 96.0; resDropPoint = 0.95; }

  const pitch = -156 + (96 - -156) * freqNorm;
  const frequencyHz = nodeGraphAnalogPitchToFreq(Math.min(pitch, maxPitch));
  const cutoffHz = frequencyHz * (4.56415 + (0.972007 - 4.56415) * chaos);

  const resGraph = [{x:0,y:reso,skew:0,shape:0},{x:resDropPoint,y:reso,skew:0,shape:0},{x:1,y:0.2,skew:0.57,shape:1}];
  const newResNormalized = nodeGraphAnalogEvalGraph(resGraph, freqNorm);
  const ellipseCGraph = [{x:0,y:7.6024,skew:0,shape:0},{x:1,y:0.00001,skew:0.99,shape:2}];
  const feedbackGainGraph = [{x:0,y:20.0,skew:0,shape:0},{x:1,y:-0.0429102,skew:0.99,shape:2}];
  const ellipseC = nodeGraphAnalogEvalGraph(ellipseCGraph, newResNormalized);
  const feedbackGain = nodeGraphAnalogEvalGraph(feedbackGainGraph, newResNormalized);

  const a = nodeGraphAnalogLadderCoefficient(cutoffHz, rate);

  const safeInput = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "yellowjacket input");
  let inputSignal = Math.max(-7, Math.min(7, safeInput * 4));
  inputSignal = state.oscSelfMod + 1.04025 * inputSignal + state.lastOutValue;

  state.phase += (frequencyHz * 1.9400625 * inputSignal) / rate;
  state.phase -= Math.floor(state.phase);

  let oscValue = nodeGraphAnalogWaveEllipseFull(state.phase, 0.0, -0.71286768918541499, 0.70129855105756955, ellipseC);
  oscValue *= 0.635417;

  let y0 = oscValue;
  y0 = y0 / (1 + y0 * y0);
  state.filterY1 = y0 + a * (y0 - state.filterY1);
  inputSignal = state.filterY1;

  state.oscSelfMod = inputSignal * 20.0;

  const out = 1.3892758936011171 * oscValue;
  state.lastOutValue = out * 0.5 * feedbackGain;

  return nodeGraphSafeFilterNumber(out, runtime, nodeId, state, "yellowjacket output");
}

// --- SuperLove Filter ---

function createNodeGraphSuperloveFilterState() {
  return { feedbackSignal: 0, filterY: [0,0,0,0,0], dcY: [0,0,0,0,0] };
}

function nodeGraphSuperloveFilterSample(state, input, params, sampleRate, runtime = null, nodeId = "") {
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const freqNorm = Math.max(0, Math.min(1, Number(params.frequency) || 0));
  const reso = Math.max(0, Math.min(1, Number(params.resonance) || 0));
  const chaos = Math.max(0, Math.min(1, Number(params.chaos) || 0));
  const mode = Math.max(0, Math.min(3, Math.round(Number(params.mode) || 0)));

  const safeInput = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "superlove input");

  if (mode <= 1) {
    const resGraph = [{x:0,y:0,skew:0,shape:0},{x:1,y:-2.7175,skew:-0.85,shape:2}];
    const noiseGraph = [{x:0,y:0.00,skew:0,shape:0},{x:0.75,y:0.05,skew:-0.7,shape:2},{x:1,y:0.10,skew:0.6,shape:2}];
    const cutoffHz = Math.max(0, Math.min(0.5 * rate, nodeGraphAnalogPitchToFreq(-12 + (135 - -12) * freqNorm)));
    const mod = nodeGraphAnalogEvalGraph(resGraph, reso);
    const noiseAmp = nodeGraphAnalogEvalGraph(noiseGraph, chaos);
    const shape = chaos;

    state.feedbackSignal = mod * state.feedbackSignal + safeInput;
    const pm = nodeGraphAnalogNextNoiseBipolar() * noiseAmp;
    const oscValue = -nodeGraphAnalogWaveTrisaw(state.feedbackSignal + 0.25725 + pm, shape);

    const a = nodeGraphAnalogLadderCoefficient(cutoffHz, rate);
    const stages = mode === 0 ? 3 : 4;
    state.feedbackSignal = nodeGraphAnalogLadderTapStep(state.filterY, oscValue, a, 1, stages);

    const dcCutoff = mode === 0 ? 10.0 : 5.0;
    const dcStages = mode === 0 ? 3 : 1;
    const dcA = nodeGraphAnalogLadderCoefficient(dcCutoff, rate);
    const dcOut = nodeGraphAnalogLadderTapStep(state.dcY, state.feedbackSignal, dcA, 2, dcStages);

    return nodeGraphSafeFilterNumber(dcOut * 1.02, runtime, nodeId, state, "superlove lp output");
  } else if (mode === 2) {
    const resGraph = [{x:0,y:-0.2,skew:0,shape:0},{x:1,y:1.3,skew:-0.85,shape:2}];
    const mod = nodeGraphAnalogEvalGraph(resGraph, reso);
    const shape = 1 - chaos;

    state.feedbackSignal = mod * state.feedbackSignal + safeInput;
    const oscValue = -nodeGraphAnalogWaveTrisaw(state.feedbackSignal + 0.75, shape);

    const lpA = nodeGraphAnalogLadderCoefficient(rate * 0.5, rate);
    let fb = nodeGraphAnalogLadderTapStep(state.filterY, oscValue * 0.1, lpA, 1, 1);

    const cutoffHz = Math.max(0, Math.min(0.5 * rate, nodeGraphAnalogPitchToFreq(-12 + (135 - -12) * freqNorm)));
    const hpA = nodeGraphAnalogLadderCoefficient(cutoffHz, rate);
    fb = nodeGraphAnalogLadderTapStep(state.dcY, fb, hpA, 2, 1);
    fb *= 10;

    state.feedbackSignal = fb;
    return nodeGraphSafeFilterNumber(-fb * 0.31, runtime, nodeId, state, "superlove hp output");
  } else {
    const resGraph = [{x:0,y:-0.2,skew:0,shape:0},{x:1,y:1.3,skew:-0.85,shape:2}];
    const mod = nodeGraphAnalogEvalGraph(resGraph, reso);
    const shape = 1 - chaos;

    state.feedbackSignal = mod * state.feedbackSignal + safeInput;
    const oscValue = -nodeGraphAnalogWaveTrisaw(state.feedbackSignal + 0.75, shape);

    const cutoffHz = Math.max(0, Math.min(0.5 * rate, nodeGraphAnalogPitchToFreq(-12 + (135 - -12) * freqNorm)));
    const a = nodeGraphAnalogLadderCoefficient(cutoffHz, rate);
    let fb = nodeGraphAnalogLadderTapStep(state.filterY, oscValue * 0.1, a, 3, 1);
    fb *= 10;

    state.feedbackSignal = fb;
    return nodeGraphSafeFilterNumber(fb, runtime, nodeId, state, "superlove bp output");
  }
}

// --- RSMET Filter ---

function createNodeGraphRsmetFilterState() {
  return { y: [0, 0, 0, 0, 0] };
}

function nodeGraphRsmetFilterModeToLadder(rsmetMode) {
  const table = [[1,1],[1,2],[1,3],[1,4],[2,1],[2,2],[2,3],[2,4],[3,1],[3,4]];
  const idx = Math.max(0, Math.min(9, Math.round(rsmetMode)));
  return table[idx];
}

function nodeGraphRsmetFilterSample(state, input, params, sampleRate, runtime = null, nodeId = "") {
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const freqNorm = Math.max(0, Math.min(1, Number(params.frequency) || 0));
  const resoNorm = Math.max(0, Math.min(1, Number(params.resonance) || 0));
  const chaos = Math.max(0, Math.min(1, Number(params.chaos) || 0));

  const freqGraph = [{x:0,y:3.0,skew:0,shape:0},{x:1,y:20000,skew:-0.95,shape:2}];
  const resoGraph = [{x:0,y:0.0,skew:0,shape:0},{x:1,y:1.0,skew:0.5,shape:2}];
  const cutoffHz = Math.max(0.000001, Math.min(rate * 0.49, nodeGraphAnalogEvalGraph(freqGraph, freqNorm)));
  const feedback = Math.max(0, Math.min(0.999, nodeGraphAnalogEvalGraph(resoGraph, resoNorm)));

  const [ladderMode, stages] = nodeGraphRsmetFilterModeToLadder(Number(params.mode) || 0);

  const wc = Math.max(1e-9, Math.min(Math.PI * 0.98, 2 * Math.PI * cutoffHz / rate));
  const sine = Math.sin(wc), cosine = Math.cos(wc), tangent = Math.tan(0.25 * (wc - Math.PI));
  let a = sine - cosine * tangent;
  a = (a > -1e-12 && a < 1e-12) ? (a >= 0 ? 1e-12 : -1e-12) : a;
  a = tangent / a;

  let mixS;
  const c = [0, 0, 0, 0, 0];
  if (ladderMode === 1) { c[stages] = 1; mixS = stages * 0.25; }
  else if (ladderMode === 2) {
    const hp = [[1,-1,0,0,0],[1,-2,1,0,0],[1,-3,3,-1,0],[1,-4,6,-4,1]];
    for (let i = 0; i <= stages; i++) c[i] = hp[stages-1][i];
    mixS = stages * 0.25;
  } else {
    const bp = [[0,2,-2,0,0],[0,2,-2,0,0],[0,0,3,-3,0],[0,0,4,-8,4]];
    for (let i = 0; i < 5; i++) c[i] = bp[stages-1][i];
    mixS = 0.125;
  }

  const b = 1 + a;
  const denom = Math.max(1e-12, 1 + a * a + 2 * a * cosine);
  const g2 = (b * b) / denom;
  const k = feedback / Math.max(1e-12, g2 * g2);
  const g = 1 + mixS * k;

  const safeInput = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "rsmet input");
  let inputSignal = Math.tanh(safeInput * 2);
  if (chaos > 0) inputSignal += (Math.random() * 2 - 1) * chaos;

  const y = state.y;
  y[0] = (g * inputSignal - k * y[4]);
  y[0] = y[0] / (1 + y[0] * y[0]);
  y[1] = y[0] + a * (y[0] - y[1]);
  y[2] = y[1] + a * (y[1] - y[2]);
  y[3] = y[2] + a * (y[2] - y[3]);
  y[4] = y[3] + a * (y[3] - y[4]);

  const out = c[0]*y[0] + c[1]*y[1] + c[2]*y[2] + c[3]*y[3] + c[4]*y[4];
  return nodeGraphSafeFilterNumber(out * 0.41, runtime, nodeId, state, "rsmet output");
}

// --- Chaotic Phase Locking Filter ---

function createNodeGraphChaoticPhaseLockingFilterState() {
  return { feedbackSignal: 0, filterY: [0,0,0,0,0], dcY: [0,0,0,0,0] };
}

function nodeGraphChaoticPhaseLockingFilterSample(state, input, params, sampleRate, runtime = null, nodeId = "") {
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const freqNorm = Math.max(0, Math.min(1, Number(params.frequency) || 0));
  const reso = Math.max(0, Math.min(1, Number(params.resonance) || 0));
  const chaos = Math.max(0, Math.min(1, Number(params.chaos) || 0));

  const cutoffHz = Math.max(0, Math.min(0.5 * rate, nodeGraphAnalogPitchToFreq(-12 + (135 - -12) * freqNorm)));
  const resGraph = [{x:0,y:0.1,skew:0,shape:0},{x:1,y:20.0,skew:-0.85,shape:2}];
  const mod = nodeGraphAnalogEvalGraph(resGraph, reso);
  const shape = 1 - chaos;

  const safeInput = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "chaotic phase locking input");
  state.feedbackSignal = mod * state.feedbackSignal + (-safeInput);
  const oscValue = nodeGraphAnalogWaveEllipse(state.feedbackSignal, shape);

  const a = nodeGraphAnalogLadderCoefficient(cutoffHz, rate);
  state.feedbackSignal = nodeGraphAnalogLadderTapStep(state.filterY, oscValue, a, 1, 2);

  const dcA = nodeGraphAnalogLadderCoefficient(5.0, rate);
  const dcOut = nodeGraphAnalogLadderTapStep(state.dcY, state.feedbackSignal, dcA, 2, 1);

  return nodeGraphSafeFilterNumber(-dcOut, runtime, nodeId, state, "chaotic phase locking output");
}

function createNodeGraphSlewLimiterState() {
  return {
    initialized: false,
    out: 0,
  };
}

function createNodeGraphClockState() {
  return {
    hasStarted: false,
    phase: 0,
  };
}

function createNodeGraphRandomClockState() {
  return {
    intervalSamples: 0,
    lastReset: 0,
    phaseSamples: 0,
    randomState: 0,
    remainingTriggerSamples: 0,
    seedKey: "",
  };
}

function createNodeGraphDelayedTriggerState() {
  return {
    hasTriggered: true,
    lastReset: 0,
    lastTrigger: 0,
    remainingSamples: 0,
    running: false,
    waitSamples: 0,
  };
}

function createNodeGraphDelayEffectState() {
  return {
    buffer: new Float32Array(1),
    bufferSize: 1,
    lfoPhase: 0,
    lfoVariationState: 0,
    position: 0,
    wet: 0,
  };
}

function createNodeGraphSabrinaReverbState() {
  return {
    nativeHandle: 0,
    nativeParamKey: "",
    nativeSampleRate: 0,
    // Only created lazily if the native WASM SIMD module isn't available for
    // offline rendering -- see nodeGraphSabrinaReverbJsSample below.
    jsState: null,
  };
}

// ---- Sabrina Reverb: non-SIMD JS fallback for offline rendering -----------
// Same port as sabrinaReverbSample's fallback in node-live-audio-worklet.js
// (see that file for the full derivation notes) -- ported from
// sabrina_reverb.cpp's own scalar reference path (delaySample/diffuseSample/
// sabrinaProcessBlockScalar), kept in sync with that file's version.
function nodeGraphSabrinaReverbFinite(value) {
  return Number.isFinite(value) && value > -1.0e12 && value < 1.0e12;
}

function nodeGraphSabrinaReverbParabol(value) {
  const wrapped = value - Math.floor(value);
  const fit = wrapped * 2.0 - 1.0;
  return 4.0 * fit * (1.0 - Math.abs(fit));
}

function createNodeGraphSabrinaReverbDelay() {
  return {
    buffer: new Float32Array(192000),
    driver: 0,
    rndNext: 0,
    feedback: 0,
    rndAcc: 0,
    offset: 0,
    modInc: 0,
    modSpeed: 0,
    lfopercent: 0,
    rndOffset: 0,
    rndMod: 0,
  };
}

function nodeGraphSabrinaReverbRnd(delay) {
  delay.rndNext = (delay.rndNext + 109) % 123094;
  delay.rndAcc = nodeGraphSabrinaReverbParabol(
    nodeGraphSabrinaReverbParabol((delay.rndNext + delay.rndAcc + 10.0) * 134987.489798 + 1987.19687) * 1987.4987 + 98497.19879,
  );
  return delay.rndAcc * 0.5 + 0.5;
}

function nodeGraphSabrinaReverbSetOffsetSize(delay, size, maxDelaySize) {
  delay.offset = maxDelaySize * delay.rndOffset * (size * 0.1 + 0.0000001) + 1.0;
}

function nodeGraphSabrinaReverbInitializeMod(delay, lfoSeconds, lfoVariation, sampleRate) {
  const seconds = lfoSeconds + delay.rndMod * lfoVariation;
  delay.modSpeed = (1.0 / (seconds > 0.000001 ? seconds : 0.000001)) / sampleRate;
}

function nodeGraphSabrinaReverbInitializeDelay(delay, seed, sampleRate) {
  delay.buffer.fill(0);
  delay.driver = 0;
  delay.feedback = 0;
  delay.rndNext = ((seed % 123094) + 123094) % 123094;
  delay.rndAcc = 0;
  nodeGraphSabrinaReverbRnd(delay);
  nodeGraphSabrinaReverbRnd(delay);
  nodeGraphSabrinaReverbRnd(delay);
  delay.rndOffset = nodeGraphSabrinaReverbRnd(delay);
  delay.rndMod = nodeGraphSabrinaReverbRnd(delay);
  delay.modInc = 0;
  delay.lfopercent = 0;
  nodeGraphSabrinaReverbSetOffsetSize(delay, 0.06, sampleRate * 4.0);
  nodeGraphSabrinaReverbInitializeMod(delay, 1.0, 0.001, sampleRate);
}

function nodeGraphSabrinaReverbReadDelay(delay, where) {
  const size = delay.buffer.length;
  let wrapped = where % size;
  if (wrapped < 0) {
    wrapped += size;
  }
  const before = Math.floor(wrapped);
  const after = (before + 1) % size;
  const mix = wrapped - before;
  return delay.buffer[before] * (1.0 - mix) + delay.buffer[after] * mix;
}

function nodeGraphSabrinaReverbDelaySample(delay, input) {
  const safeInput = nodeGraphSabrinaReverbFinite(input) ? input : 0.0;
  delay.modInc += delay.modSpeed;
  const lfo = nodeGraphSabrinaReverbParabol(delay.modInc) * 0.5 + 0.5;
  const readPosition = delay.driver - delay.offset - delay.offset * lfo * delay.lfopercent;
  delay.driver = (delay.driver + 1) % delay.buffer.length;
  const delayed = nodeGraphSabrinaReverbReadDelay(delay, readPosition);
  delay.buffer[delay.driver] = safeInput;
  return nodeGraphSabrinaReverbFinite(delayed) ? delayed : 0.0;
}

function nodeGraphSabrinaReverbDiffuseSample(delay, input) {
  const safeInput = nodeGraphSabrinaReverbFinite(input) ? input : 0.0;
  delay.modInc += delay.modSpeed;
  const lfo = nodeGraphSabrinaReverbParabol(delay.modInc) * 0.5 + 0.5;
  const readPosition = delay.driver - delay.offset - delay.offset * lfo * delay.lfopercent;
  delay.driver = (delay.driver + 1) % delay.buffer.length;
  const delayed = nodeGraphSabrinaReverbReadDelay(delay, readPosition);
  delay.buffer[delay.driver] = clampNodeSliderValue((0.0 - safeInput) - delayed * delay.feedback, -16.0, 16.0);
  const output = safeInput * delay.feedback - delayed * (1.0 - delay.feedback * delay.feedback);
  return nodeGraphSabrinaReverbFinite(output) ? output : 0.0;
}

function nodeGraphSabrinaReverbReseedDelays(state, seed) {
  state.seed = seed;
  for (let index = 0; index < 14; index += 1) {
    nodeGraphSabrinaReverbInitializeDelay(state.delays[index], index * 137 + 7 + seed * 9973, state.sampleRate);
  }
}

function nodeGraphSabrinaReverbApplyDelayGeometry(state) {
  const maxDelaySize = state.sampleRate * 4.0;
  const lfoSpeed = ((1.0 - state.smoothedLfoBaseSpeed) * 1.95 + 0.5) * 0.5;
  const lfoVariation = (1.0 - state.smoothedLfoVariation) * 0.25;
  const diffusionSizeFactor = state.smoothedDiffusionSize * 0.1 + 0.0000001;
  const sharedFeedback = state.diffusionAmount;
  const sharedLfopercent = state.smoothedLfoAmplitude * 0.1;
  for (let index = 0; index < 12; index += 1) {
    const delay = state.delays[index];
    delay.offset = maxDelaySize * diffusionSizeFactor * delay.rndOffset + 1.0;
    const seconds = lfoSpeed + delay.rndMod * lfoVariation;
    const safeSeconds = Math.max(seconds, 0.000001);
    delay.modSpeed = (1.0 / safeSeconds) / state.sampleRate;
    delay.feedback = sharedFeedback;
    delay.lfopercent = sharedLfopercent;
  }
  for (let index = 12; index < 14; index += 1) {
    const delay = state.delays[index];
    delay.offset = (maxDelaySize - 2.0) * state.smoothedDelaySize * 0.1 + 1.0;
    delay.lfopercent = state.smoothedLfoAmplitude * 0.1;
    nodeGraphSabrinaReverbInitializeMod(delay, lfoSpeed, lfoVariation, state.sampleRate);
  }
}

function nodeGraphSabrinaReverbSmoothingNeedsWork(state) {
  const epsilon = 1e-6;
  const near = (a, b) => Math.abs(a - b) < epsilon;
  return !(
    near(state.smoothedDiffusionSize, state.diffusionSize) &&
    near(state.smoothedDelaySize, state.delaySize) &&
    near(state.smoothedLfoAmplitude, state.lfoAmplitude) &&
    near(state.smoothedLfoBaseSpeed, state.lfoBaseSpeed) &&
    near(state.smoothedLfoVariation, state.lfoVariation)
  );
}

function nodeGraphSabrinaReverbAdvanceSmoothing(state) {
  if (!nodeGraphSabrinaReverbSmoothingNeedsWork(state)) {
    return;
  }
  const alpha = state.paramSmoothAlpha;
  state.smoothedDiffusionSize += (state.diffusionSize - state.smoothedDiffusionSize) * alpha;
  state.smoothedDelaySize += (state.delaySize - state.smoothedDelaySize) * alpha;
  state.smoothedLfoAmplitude += (state.lfoAmplitude - state.smoothedLfoAmplitude) * alpha;
  state.smoothedLfoBaseSpeed += (state.lfoBaseSpeed - state.smoothedLfoBaseSpeed) * alpha;
  state.smoothedLfoVariation += (state.lfoVariation - state.smoothedLfoVariation) * alpha;
  nodeGraphSabrinaReverbApplyDelayGeometry(state);
}

function createNodeGraphSabrinaReverbJsState(sampleRate) {
  const safeRate = clampNodeSliderValue(Number(sampleRate) || 44100, 1, 192000);
  const state = {
    delays: Array.from({ length: 14 }, () => createNodeGraphSabrinaReverbDelay()),
    sampleRate: safeRate,
    ch0: 0,
    ch1: 0,
    lastWet: 0,
    mix: 0.43,
    diffusionSize: 0.35,
    diffusionAmount: 0.70,
    delaySize: 0.02,
    recycle: 0.70,
    lfoAmplitude: 0.07,
    lfoBaseSpeed: 0.83,
    lfoVariation: 0.001,
    seed: 0,
    smoothedDiffusionSize: 0.35,
    smoothedDelaySize: 0.02,
    smoothedLfoAmplitude: 0.07,
    smoothedLfoBaseSpeed: 0.83,
    smoothedLfoVariation: 0.001,
    paramSmoothAlpha: 1.0 - Math.exp(-1.0 / (0.05 * safeRate)),
  };
  nodeGraphSabrinaReverbReseedDelays(state, 0);
  nodeGraphSabrinaReverbApplyDelayGeometry(state);
  return state;
}

function nodeGraphSabrinaReverbJsSample(state, leftInput, rightInput, params, rateHz) {
  const safeRate = clampNodeSliderValue(Number(rateHz) || 44100, 1, 192000);
  if (state.sampleRate !== safeRate) {
    Object.assign(state, createNodeGraphSabrinaReverbJsState(safeRate));
  }
  state.mix = clampNodeSliderValue(Number(params.mix) || 0, 0, 1);
  state.diffusionSize = clampNodeSliderValue(Number(params.diffusionSize) || 0, 0, 1);
  state.diffusionAmount = clampNodeSliderValue(Number(params.diffusionAmount) || 0, 0, 0.98);
  state.delaySize = clampNodeSliderValue(Number(params.delaySize) || 0, 0, 1);
  state.recycle = clampNodeSliderValue(Number(params.recycle) || 0, 0, 0.98);
  state.lfoAmplitude = clampNodeSliderValue(Number(params.lfoAmplitude) || 0, 0, 1);
  state.lfoBaseSpeed = clampNodeSliderValue(Number(params.lfoBaseSpeed) || 0, 0, 1);
  state.lfoVariation = clampNodeSliderValue(Number(params.lfoVariation) || 0, 0, 1);
  const seedInt = Math.round(Number(params.seed) || 0);
  if (seedInt !== state.seed) {
    nodeGraphSabrinaReverbReseedDelays(state, seedInt);
  }

  nodeGraphSabrinaReverbAdvanceSmoothing(state);
  const dryLeft = nodeGraphSabrinaReverbFinite(leftInput) ? leftInput : 0.0;
  const dryRight = nodeGraphSabrinaReverbFinite(rightInput) ? rightInput : dryLeft;
  const preLeft = nodeGraphSabrinaReverbDelaySample(state.delays[12], state.ch1);
  const preRight = nodeGraphSabrinaReverbDelaySample(state.delays[13], state.ch0);
  let left = dryLeft + preLeft * state.recycle;
  let right = dryRight + preRight * state.recycle;
  for (let index = 0; index < 6; index += 1) {
    const outLeft = nodeGraphSabrinaReverbDiffuseSample(state.delays[index * 2], left);
    const outRight = nodeGraphSabrinaReverbDiffuseSample(state.delays[index * 2 + 1], right);
    left = outLeft;
    right = outRight;
  }
  state.ch0 = nodeGraphSabrinaReverbFinite(left) ? clampNodeSliderValue(left, -16.0, 16.0) : 0.0;
  state.ch1 = nodeGraphSabrinaReverbFinite(right) ? clampNodeSliderValue(right, -16.0, 16.0) : 0.0;
  const mixLeft = state.ch0 * state.mix + dryLeft * (1.0 - state.mix);
  const mixRight = state.ch1 * state.mix + dryRight * (1.0 - state.mix);
  state.lastWet = (state.ch0 + state.ch1) * 0.5;
  return {
    "Left Dry": dryLeft,
    "Mono Dry": (dryLeft + dryRight) * 0.5,
    "Right Dry": dryRight,
    "Left Mix": mixLeft,
    "Mono Mix": (mixLeft + mixRight) * 0.5,
    "Right Mix": mixRight,
  };
}

function createNodeGraphPllState() {
  return { nativeHandle: 0, nativeParamKey: "", nativeSampleRate: 0 };
}

function createNodeGraphHelmholtzState() {
  return { nativeHandle: 0, nativeParamKey: "", nativeSampleRate: 0 };
}

function createNodeGraphSampleHoldState() {
  return {
    clockPhase: 0,
    held: 0,
    lastTrigger: 0,
    noise: createNodeGraphNoiseGeneratorChannelState(),
  };
}

function createNodeGraphSamplePlaybackState() {
  return {
    lastReset: 0,
    phase: 0,
    playing: false,
    rangeKey: "",
    sampleId: "",
  };
}

function createNodeGraphStepSequencerState() {
  return {
    gate: 0,
    index: 0,
    lastReset: 0,
    lastTrigger: 0,
    out: 0,
  };
}

function createNodeGraphTriggerCounterState() {
  return {
    count: 0,
    lastReset: 0,
    lastTrigger: 0,
    remainingSamples: 0,
  };
}

function createNodeGraphTriggerDividerState() {
  return {
    count: 0,
    lastReset: 0,
    lastTrigger: 0,
    remainingSamples: 0,
  };
}

function createNodeGraphExpAdsrState() {
  return {
    lastGate: 0,
    out: 0,
    secondsPassed: 0,
    state: "off",
  };
}

function createNodeGraphLinearEnvelopeState() {
  return {
    lastGate: 0,
    out: 0,
    releaseDecrement: 0,
    secondsPassed: 0,
    state: "off",
  };
}

function createNodeGraphPluckEnvelopeState() {
  return {
    autoReleasePhasor: 0,
    currentValue: 0,
    decayIncrement: 0,
    lastRelease: 0,
    lastTrigger: 0,
    phasor: 0,
    releaseIncrement: 0,
    secondsPassed: 0,
    state: "off",
  };
}

function createNodeGraphVactrolEnvelopeState() {
  return {
    out: 0,
    raw: 0,
  };
}

function createNodeGraphFlowerChildEnvelopeFollowerState() {
  return {
    currentSlewedValue: 0,
    holdCounter: 0,
    out: 0,
  };
}

function createNodeGraphNoiseGeneratorChannelState() {
  return { brown: 0, gaussianSpare: null, pink: [0, 0, 0, 0, 0, 0, 0], seed: 0, seedKey: "" };
}

function createNodeGraphNoiseGeneratorState() {
  return { left: createNodeGraphNoiseGeneratorChannelState(), right: createNodeGraphNoiseGeneratorChannelState() };
}

function createNodeGraphRandomWalkState() {
  return {
    lowpass: createNodeGraphLowpassState(),
    out: 0,
    seed: 0,
    seedKey: "",
  };
}

function createNodeGraphFractalBrownianNoiseState() {
  return {
    axes: {},
    resetWasHigh: false,
  };
}

const nodeGraphBadValueExplosionLimit = 999999999;
const nodeGraphBadValueDenormalLimit = 1.1754943508222875e-38;

function nodeGraphBadValueReason(value) {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return "NaN";
  }
  if (!Number.isFinite(number)) {
    return "inf";
  }
  if (Math.abs(number) > nodeGraphBadValueExplosionLimit) {
    return "exploded";
  }
  if (number !== 0 && Math.abs(number) < nodeGraphBadValueDenormalLimit) {
    return "denormal";
  }
  return "";
}

function nodeGraphMarkRuntimeBadNumber(runtime, nodeId, source = "dsp") {
  if (!runtime) {
    return;
  }
  runtime.badNumberCount = (runtime.badNumberCount || 0) + 1;
  runtime.lastBadNumber = { nodeId, source };
  if (typeof nodeGraphRecordBadValueEvent === "function") {
    nodeGraphRecordBadValueEvent({
      engine: runtime.engine || "runtime",
      nodeId,
      reason: source.split(" ").pop() || "bad",
      source,
    });
  }
}

function nodeGraphSafeFilterNumber(value, runtime, nodeId, state, source) {
  const number = Number(value);
  const reason = nodeGraphBadValueReason(number);
  if (!reason) {
    return number;
  }
  if (state) {
    state.inputBuffer = 0;
    state.outputBuffer = 0;
  }
  nodeGraphMarkRuntimeBadNumber(runtime, nodeId, `${source} ${reason}`);
  return 0;
}

function nodeGraphCodeblockCacheKey(codeblock) {
  return `${codeblock.inputs.join(",")}=>${codeblock.outputs.join(",")}::${codeblock.code}`;
}

function nodeGraphCreateCodeblockOutputObject(codeblock) {
  const output = {};
  for (const port of codeblock.outputs) {
    output[port] = 0;
  }
  return output;
}

function nodeGraphCompileCodeblockFunction(runtime, node) {
  const codeblock = normalizeNodeGraphCodeblock(node.codeblock);
  const key = nodeGraphCodeblockCacheKey(codeblock);
  const cached = runtime.codeblockFunctions?.get(node.id);
  if (cached?.key === key) {
    return cached;
  }
  const fn = Function(
    "__inputs",
    "__outputs",
    "__state",
    "__context",
    nodeGraphCodeblockBuildFunctionBody(codeblock),
  );
  const compiled = {
    codeblock,
    fn,
    inputs: new Array(codeblock.inputs.length).fill(0),
    key,
    output: nodeGraphCreateCodeblockOutputObject(codeblock),
    state: Object.create(null),
  };
  runtime.codeblockFunctions?.set(node.id, compiled);
  return compiled;
}

function nodeGraphEvaluateCodeblock(runtime, node, mixInput, sampleRate = nodeGraphMvp?.sampleRate || 44100, frame = 0, frames = 1) {
  let compiled = null;
  try {
    compiled = nodeGraphCompileCodeblockFunction(runtime, node);
  } catch (error) {
    nodeGraphMarkRuntimeBadNumber(runtime, node.id, `codeblock compile error ${error?.message || ""}`);
    return {};
  }
  const { codeblock, fn, inputs, output, state } = compiled;
  try {
    for (let index = 0; index < codeblock.inputs.length; index += 1) {
      const port = codeblock.inputs[index];
      inputs[index] = nodeGraphSafeFilterNumber(
        mixInput(node.id, port),
        runtime,
        node.id,
        null,
        `codeblock ${port} input`,
      );
    }
    for (const port of codeblock.outputs) {
      output[port] = 0;
    }
    fn(inputs, output, state, {
      frame,
      frames,
      sampleRate,
      time: (Number(frame) || 0) / (Number(sampleRate) || 44100),
    });
    for (const port of codeblock.outputs) {
      output[port] = nodeGraphSafeFilterNumber(
        output[port],
        runtime,
        node.id,
        null,
        `codeblock ${port} output`,
      );
    }
    return output;
  } catch (error) {
    nodeGraphMarkRuntimeBadNumber(runtime, node.id, `codeblock runtime error ${error?.message || ""}`);
    for (const port of codeblock.outputs) {
      output[port] = 0;
    }
    return output;
  }
}

function nodeGraphEvaluateModuleGroup(runtime, node, mixInput, sampleRate, frame, frames) {
  const group = node.moduleGroup?.kind === "moduleGroup"
    ? node.moduleGroup
    : normalizeNodeGraphModuleGroup(node.moduleGroup);
  if (!group.sourcePatch) {
    return {};
  }
  let groupRuntime = runtime.moduleGroupRuntimes?.get(node.id);
  if (!groupRuntime) {
    try {
      groupRuntime = createNodeGraphLiveRuntime(nodeGraphBuildLivePlanForPatch(group.sourcePatch));
      runtime.moduleGroupRuntimes?.set(node.id, groupRuntime);
    } catch (error) {
      nodeGraphMarkRuntimeBadNumber(runtime, node.id, `module group plan error ${error?.message || ""}`);
      return {};
    }
  }
  groupRuntime.externalButtonEvents = runtime.externalButtonEvents;
  groupRuntime.wireBreakEvent = runtime.wireBreakEvent;
  groupRuntime.wireConnectEvent = runtime.wireConnectEvent;
  groupRuntime.wireDisconnectEvent = runtime.wireDisconnectEvent;
  groupRuntime.windowReopenEvent = runtime.windowReopenEvent;
  groupRuntime.shootingStarExplosionEvent = runtime.shootingStarExplosionEvent;
  groupRuntime.externalGroupInputs = new Map(
    group.inputs.map((input) => [input.nodeId, mixInput(node.id, input.name)]),
  );
  const groupFrame = evaluateNodeGraphPlanFrame(groupRuntime, sampleRate, frame, frames);
  const output = {};
  for (const endpoint of group.outputs) {
    output[endpoint.name] = readNodeGraphRuntimePortOutput(
      groupRuntime,
      groupFrame.frameValues,
      endpoint.nodeId,
      endpoint.port || "Out",
      frame,
      frames,
    );
  }
  return output;
}

function nodeGraphVisualControlIntensity(value, runtime, nodeId, source = "visual control") {
  const safeValue = nodeGraphSafeFilterNumber(value, runtime, nodeId, null, source);
  return clampNodeSliderValue(Math.abs(safeValue), 0, 1);
}

function nodeGraphVisualControlSigned(value, runtime, nodeId, source = "visual control") {
  const safeValue = nodeGraphSafeFilterNumber(value, runtime, nodeId, null, source);
  return clampNodeSliderValue(safeValue, -1, 1);
}

function nodeGraphScreenSpaceShaderSample(node, readInput, runtime, nodeId, sampleRate) {
  const script = normalizeNodeGraphScreenSpaceShader(node?.screenSpaceShader);
  const value = {};
  for (const input of script.visualInputs || []) {
    if (input.mode === "raw") {
      continue;
    }
    const raw = readInput(input.port);
    const signed = input.mode === "signed";
    const target = signed
      ? nodeGraphVisualControlSigned(raw, runtime, nodeId, `screen space shader ${input.port}`)
      : nodeGraphVisualControlIntensity(raw, runtime, nodeId, `screen space shader ${input.port}`);
    value[input.key] = nodeGraphSmoothVisualControl(
      runtime,
      input.key,
      target,
      sampleRate,
      signed ? 0.045 : 0.025,
      signed ? -1 : 0,
      1,
    );
  }
  return value;
}

function nodeGraphVisualHslToRgb(hue, saturation, lightness) {
  const h = ((Number(hue) || 0) % 1 + 1) % 1;
  const s = clampNodeSliderValue(Number(saturation) || 0, 0, 1);
  const l = clampNodeSliderValue(Number(lightness) || 0, 0, 1);
  if (s <= 0) {
    return [l, l, l];
  }
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const channel = (offset) => {
    let t = h + offset;
    if (t < 0) {
      t += 1;
    }
    if (t > 1) {
      t -= 1;
    }
    if (t < 1 / 6) {
      return p + (q - p) * 6 * t;
    }
    if (t < 1 / 2) {
      return q;
    }
    if (t < 2 / 3) {
      return p + (q - p) * (2 / 3 - t) * 6;
    }
    return p;
  };
  return [channel(1 / 3), channel(0), channel(-1 / 3)];
}

function createNodeGraphVisualControlState() {
  return {
    controls: {
      blue: 0,
      chromaAlpha: 0,
      chromaDrift: 0,
      chromaHue: 0,
      chromaLightness: 0,
      chromaSaturation: 0,
      chromaSpread: 0,
      green: 0,
      red: 0,
      scopePaused: 0,
      scopeTracesOff: 0,
      screenDim: 0,
      screenShake: 0,
      visualBloom: 0,
      visualBrightness: 0,
      visualGlow: 0,
      x: 0,
      y: 0,
    },
    states: new Map([
      ["blue", 0],
      ["chromaAlpha", 0],
      ["chromaDrift", 0],
      ["chromaHue", 0],
      ["chromaLightness", 0],
      ["chromaSaturation", 0],
      ["chromaSpread", 0],
      ["green", 0],
      ["red", 0],
      ["scopePaused", 0],
      ["scopeTracesOff", 0],
      ["screenDim", 0],
      ["screenShake", 0],
      ["visualBloom", 0],
      ["visualBrightness", 0],
      ["visualGlow", 0],
      ["x", 0],
      ["y", 0],
    ]),
  };
}

function resetNodeGraphRuntimeVisualControls(runtime) {
  if (!runtime) {
    return;
  }
  const visualState = createNodeGraphVisualControlState();
  runtime.visualControls = visualState.controls;
  runtime.visualControlStates = visualState.states;
}

function nodeGraphSmoothVisualControl(runtime, key, target, sampleRate, seconds = 0.045, min = 0, max = 1) {
  if (!runtime.visualControls) {
    runtime.visualControls = createNodeGraphVisualControlState().controls;
  }
  if (!runtime.visualControlStates) {
    runtime.visualControlStates = new Map();
  }
  const safeTarget = clampNodeSliderValue(Number(target) || 0, min, max);
  const previous = Number(runtime.visualControlStates.get(key));
  const current = Number.isFinite(previous) ? previous : 0;
  const rate = Math.max(1, sampleRate || nodeGraphMvp.sampleRate || 44100);
  const time = Math.max(0, Number(seconds) || 0);
  const coefficient = time <= 0 ? 1 : 1 - Math.exp(-1 / Math.max(1, time * rate));
  const next = current + (safeTarget - current) * coefficient;
  const cleaned = Math.abs(next) < 0.000001 ? 0 : clampNodeSliderValue(next, min, max);
  runtime.visualControlStates.set(key, cleaned);
  runtime.visualControls[key] = cleaned;
  return cleaned;
}

function nodeGraphBadValueMonitorSample(value, runtime, nodeId) {
  const number = Number(value);
  const reason = nodeGraphBadValueReason(number);
  if (reason) {
    if (runtime) {
      runtime.badNumberCount = (runtime.badNumberCount || 0) + 1;
      runtime.lastBadNumber = { nodeId, source: `badval monitor input ${reason}` };
    }
    if (typeof nodeGraphRecordBadValueEvent === "function") {
      nodeGraphRecordBadValueEvent({
        engine: runtime?.engine || "runtime",
        force: true,
        nodeId,
        reason,
        source: "BADVAL Monitor input",
      });
    }
  }
  return number;
}

function nodeGraphSpeakerProtectionSample(value, runtime, nodeId) {
  const number = Number(value);
  const unsafe = !Number.isFinite(number) || Math.abs(number) > 1;
  if (unsafe && runtime) {
    runtime.speakerProtectionMuteCount = (runtime.speakerProtectionMuteCount || 0) + 1;
    runtime.speakerProtectionPeak = Math.max(
      Number(runtime.speakerProtectionPeak) || 0,
      Number.isFinite(number) ? Math.abs(number) : Infinity,
    );
    runtime.lastSpeakerProtection = { nodeId, peak: runtime.speakerProtectionPeak };
  }
  return unsafe ? 0 : number;
}

function nodeGraphSoftClipperSample(input, center = 0, width = 2) {
  const safeWidth = Math.max(0.000001, Math.abs(Number(width) || 2));
  const safeCenter = Number(center) || 0;
  const scaleX = 2 / safeWidth;
  const shiftX = -1 - (scaleX * (safeCenter - 0.5 * safeWidth));
  const scaleY = 1 / scaleX;
  const shiftY = -shiftX * scaleY;
  return shiftY + scaleY * Math.tanh(scaleX * (Number(input) || 0) + shiftX);
}

function nodeGraphOnePoleHighpassSample(state, input, frequency, sampleRate, runtime = null, nodeId = "") {
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const safeInput = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "highpass input");
  const frequencyValue = Math.max(0, nodeGraphSafeFilterNumber(frequency, runtime, nodeId, state, "highpass frequency"));
  const w = Math.min((Math.PI * 2) / rate, 0.000142475857) * frequencyValue;
  const a1 = Math.exp(-w);
  const b0 = 0.5 * (1 + a1);
  const b1 = -b0;
  state.outputBuffer = nodeGraphSafeFilterNumber(
    b0 * safeInput + b1 * state.inputBuffer + a1 * state.outputBuffer,
    runtime,
    nodeId,
    state,
    "highpass output",
  );
  state.inputBuffer = safeInput;
  return state.outputBuffer;
}

function nodeGraphOnePoleLowpassSample(state, input, frequency, sampleRate, runtime = null, nodeId = "") {
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const safeInput = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "lowpass input");
  const frequencyValue = Math.max(0, nodeGraphSafeFilterNumber(frequency, runtime, nodeId, state, "lowpass frequency"));
  const w = Math.min((Math.PI * 2) / rate, 0.000142475857) * frequencyValue;
  const a1 = Math.exp(-w);
  const b0 = 1 - a1;
  state.outputBuffer = nodeGraphSafeFilterNumber(
    b0 * safeInput + a1 * state.outputBuffer,
    runtime,
    nodeId,
    state,
    "lowpass output",
  );
  return state.outputBuffer;
}


function nodeGraphLadderFilterStageCount(stages) {
  const value = Math.round(Number(stages));
  return Number.isFinite(value) ? clampNodeSliderValue(value, 1, 4) : 4;
}

function nodeGraphLadderFilterMix(mode, stages) {
  const safeMode = Math.round(clampNodeSliderValue(Number(mode) || 0, 0, 3));
  const stageCount = nodeGraphLadderFilterStageCount(stages);
  const c = [0, 0, 0, 0, 0];
  let s = 1;
  if (safeMode === 0) {
    c[0] = 1;
    s = 0.125;
  } else if (safeMode === 1) {
    c[stageCount] = 1;
    s = stageCount * 0.25;
  } else if (safeMode === 2) {
    const coefficients = [
      [1, -1],
      [1, -2, 1],
      [1, -3, 3, -1],
      [1, -4, 6, -4, 1],
    ][stageCount - 1];
    for (let index = 0; index < coefficients.length; index += 1) {
      c[index] = coefficients[index];
    }
    s = stageCount * 0.25;
  } else {
    const coefficients = stageCount <= 2
      ? [0, 2, -2, 0, 0]
      : stageCount === 3
        ? [0, 0, 3, -3, 0]
        : [0, 0, 4, -8, 4];
    for (let index = 0; index < coefficients.length; index += 1) {
      c[index] = coefficients[index];
    }
    s = 0.125;
  }
  return { c, s, stageCount, mode: safeMode };
}

function nodeGraphLadderFilterComputeFeedbackFactor(feedback, cosWc, a) {
  const b = 1 + a;
  const denominator = Math.max(1e-12, 1 + a * a + 2 * a * cosWc);
  const g2 = (b * b) / denominator;
  return feedback / Math.max(1e-12, g2 * g2);
}

function nodeGraphLadderFilterCoefficients(frequency, resonance, mode, stages, sampleRate, runtime = null, nodeId = "", state = null) {
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const frequencyValue = Math.max(0, nodeGraphSafeFilterNumber(frequency, runtime, nodeId, state, "ladder filter frequency"));
  const safeFrequency = clampNodeSliderValue(frequencyValue, 0.000001, Math.min(20000, rate * 0.49));
  const feedback = clampNodeSliderValue(
    nodeGraphSafeFilterNumber(resonance, runtime, nodeId, state, "ladder filter resonance"),
    0,
    0.999,
  );
  const wc = clampNodeSliderValue((2 * Math.PI * safeFrequency) / rate, 1e-9, Math.PI * 0.98);
  const sine = Math.sin(wc);
  const cosine = Math.cos(wc);
  const tangent = Math.tan(0.25 * (wc - Math.PI));
  let a = tangent / Math.max(1e-12, sine - cosine * tangent);
  if (!Number.isFinite(a)) {
    a = -1;
  }
  const mix = nodeGraphLadderFilterMix(mode, stages);
  const k = nodeGraphLadderFilterComputeFeedbackFactor(feedback, cosine, a);
  const g = 1 + mix.s * k;
  return { ...mix, a, g, k };
}

function nodeGraphLadderFilterSample(state, input, params, sampleRate, runtime = null, nodeId = "") {
  const safeInput = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "ladder filter input");
  const coeff = nodeGraphLadderFilterCoefficients(
    params.frequency,
    params.resonance,
    params.mode,
    params.stages,
    sampleRate,
    runtime,
    nodeId,
    state,
  );
  const y = Array.isArray(state.y) && state.y.length >= 5 ? state.y : [0, 0, 0, 0, 0];
  state.y = y;
  y[0] = coeff.g * safeInput - coeff.k * y[4];
  y[0] = y[0] / (1 + y[0] * y[0]);
  y[1] = y[0] + coeff.a * (y[0] - y[1]);
  y[2] = y[1] + coeff.a * (y[1] - y[2]);
  y[3] = y[2] + coeff.a * (y[2] - y[3]);
  y[4] = y[3] + coeff.a * (y[3] - y[4]);
  for (let index = 0; index < y.length; index += 1) {
    y[index] = nodeGraphSafeFilterNumber(y[index], runtime, nodeId, state, `ladder filter stage ${index}`);
  }
  const output = coeff.c[0] * y[0] + coeff.c[1] * y[1] + coeff.c[2] * y[2] + coeff.c[3] * y[3] + coeff.c[4] * y[4];
  return nodeGraphSafeFilterNumber(output, runtime, nodeId, state, "ladder filter output");
}

function createNodeGraphTb303FilterState() {
  return { y: [0, 0, 0, 0], hpX: 0, hpY: 0 };
}

function nodeGraphTb303FilterSample(state, input, params, sampleRate, runtime = null, nodeId = "") {
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const safeCutoff = Math.max(200, Math.min(20000, Math.min(rate * 0.49, Number(params.cutoff) || 1000)));
  const resonanceRaw = Math.max(0, Math.min(1, (Number(params.resonance) || 0) * 0.01));
  const drive = Number(params.drive) || 0;
  const driveFactor = Math.pow(10, Math.max(-24, Math.min(24, drive)) / 20);
  const safeMode = Math.max(0, Math.min(14, Math.round(Number(params.mode) || 4)));

  // resonance skewing
  const r = (1 - Math.exp(-3 * resonanceRaw)) / (1 - Math.exp(-3));

  // coefficients
  const wc = Math.max(1e-9, Math.min(Math.PI * 0.98, 2 * Math.PI * safeCutoff / rate));
  const sinWc = Math.sin(wc), cosWc = Math.cos(wc);
  const tanWc = Math.tan(0.25 * (wc - Math.PI));
  const denomA = sinWc - cosWc * tanWc;
  const a1FullRes = Math.abs(denomA) < 1e-15 ? -1 : tanWc / denomA;
  const a1NoRes = -Math.exp(-wc);
  const a1 = r * a1FullRes + (1 - r) * a1NoRes;
  const b0 = 1 + a1;
  const gsqD = Math.max(1e-12, 1 + a1 * a1 + 2 * a1 * cosWc);
  const gsq = b0 * b0 / gsqD;
  const k = r / Math.max(1e-24, gsq * gsq);

  // feedback highpass (1-pole, 150 Hz)
  if (!state.hpP || state.lastRate !== rate) {
    state.hpP = Math.exp(-2 * Math.PI * 150 / rate);
    state.hpB0 = (1 + state.hpP) * 0.5;
    state.lastRate = rate;
  }
  const fbIn = k * (state.y[3] || 0);
  const fbHp = state.hpB0 * (fbIn - state.hpX) + state.hpP * state.hpY;
  state.hpX = fbIn;
  state.hpY = nodeGraphSafeFilterNumber(fbHp, runtime, nodeId, state, "tb303 hp");

  const safeIn = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "tb303 in");
  const y = state.y;
  const y0 = nodeGraphSafeFilterNumber(0.125 * driveFactor * safeIn - fbHp, runtime, nodeId, state, "tb303 y0");
  y[0] = nodeGraphSafeFilterNumber(y0 + a1 * (y0 - y[0]), runtime, nodeId, state, "tb303 y1");
  y[1] = nodeGraphSafeFilterNumber(y[0] + a1 * (y[0] - y[1]), runtime, nodeId, state, "tb303 y2");
  y[2] = nodeGraphSafeFilterNumber(y[1] + a1 * (y[1] - y[2]), runtime, nodeId, state, "tb303 y3");
  y[3] = nodeGraphSafeFilterNumber(y[2] + a1 * (y[2] - y[3]), runtime, nodeId, state, "tb303 y4");

  // mode mix coefficients
  const modes = [
    [1,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0],[0,0,0,0,1],
    [1,-1,0,0,0],[1,-2,1,0,0],[1,-3,3,-1,0],[1,-4,6,-4,1],
    [0,0,1,-2,1],[0,0,0,1,-1],[0,1,-3,3,-1],[0,0,1,-1,0],[0,1,-2,1,0],[0,1,-1,0,0],
  ];
  const c = modes[safeMode] || modes[4];
  const out = 8 * (c[0]*y0 + c[1]*y[0] + c[2]*y[1] + c[3]*y[2] + c[4]*y[3]);
  return nodeGraphSafeFilterNumber(out, runtime, nodeId, state, "tb303 out");
}

function nodeGraphSlewLimiterSample(state, input, upTime, downTime, sampleRate, runtime = null, nodeId = "") {
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const target = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "slew input");
  if (!state.initialized) {
    state.initialized = true;
    state.out = target;
    return target;
  }
  const upSeconds = Math.max(0, nodeGraphSafeFilterNumber(upTime, runtime, nodeId, state, "slew up time"));
  const downSeconds = Math.max(0, nodeGraphSafeFilterNumber(downTime, runtime, nodeId, state, "slew down time"));
  const delta = target - state.out;
  const maxRise = upSeconds <= 0 ? Infinity : 1 / Math.max(1, upSeconds * rate);
  const maxFall = downSeconds <= 0 ? Infinity : 1 / Math.max(1, downSeconds * rate);
  state.out = nodeGraphSafeFilterNumber(
    state.out + Math.max(-maxFall, Math.min(maxRise, delta)),
    runtime,
    nodeId,
    state,
    "slew output",
  );
  return state.out;
}

function nodeGraphClockAnalogWhipSample(phase, level) {
  const p = clampNodeSliderValue(Number(phase) || 0, 0, 1);
  const attack = 1 - Math.pow(1 - Math.min(1, p / 0.035), 4);
  const release = Math.pow(Math.max(0, 1 - p), 1.85);
  const snapEnvelope = attack * release;
  const sweepTurns = (3.15 * (1 - Math.exp(-4.2 * p)) / (1 - Math.exp(-4.2))) + (0.18 * Math.sin(Math.PI * p));
  const liquidBend = 0.075 * Math.sin(Math.PI * 2 * p) * Math.pow(Math.max(0, 1 - p), 1.2);
  const body = Math.sin((sweepTurns + liquidBend) * Math.PI * 2);
  const sheen = Math.sin((sweepTurns * 2.02 + 0.17) * Math.PI * 2) * 0.16 * Math.pow(Math.max(0, 1 - p), 2.8);
  return (body + sheen) * snapEnvelope * level;
}

function nodeGraphClockSample(state, reset, phaseOffset, rate, duty, level, sampleRate, runtime = null, nodeId = "") {
  const safeReset = nodeGraphSafeFilterNumber(reset, runtime, nodeId, null, "clock reset");
  const safePhaseOffset = wrapNodeSliderValue(
    nodeGraphSafeFilterNumber(phaseOffset, runtime, nodeId, null, "clock phase"),
    0,
    1,
  );
  const safeRate = Math.max(0, nodeGraphSafeFilterNumber(rate, runtime, nodeId, null, "clock rate"));
  const safeDuty = clampNodeSliderValue(
    nodeGraphSafeFilterNumber(duty, runtime, nodeId, null, "clock duty"),
    0,
    1,
  );
  const safeLevel = nodeGraphSafeFilterNumber(level, runtime, nodeId, null, "clock level");
  const resetActive = safeReset > 0;
  const rawPhase = resetActive ? 0 : wrapNodeSliderValue(Number(state.phase) || 0, 0, 1);
  const phase = wrapNodeSliderValue(rawPhase + safePhaseOffset, 0, 1);
  const digital = phase < safeDuty ? safeLevel : 0;
  const analog = nodeGraphClockAnalogWhipSample(phase, safeLevel);
  const nextRawPhase = wrapNodeSliderValue(rawPhase + safeRate / Math.max(1, sampleRate), 0, 1);
  const pulse = safeRate > 0 && !resetActive && (!state.hasStarted || nextRawPhase < rawPhase) ? safeLevel : 0;
  state.hasStarted = !resetActive;
  state.phase = resetActive ? 0 : nextRawPhase;
  return {
    "Analog Out": analog,
    "Digital Out": digital,
    Out: digital,
    Pulse: pulse,
  };
}

function nodeGraphTransportDivisionFactor(divisions) {
  const division = Math.round(Number(divisions) || 0);
  if (division > 0) {
    return division + 1;
  }
  if (division < 0) {
    return 1 / (Math.abs(division) + 1);
  }
  return 1;
}

function nodeGraphTransportSample(params, absoluteFrame, sampleRate, runtime = null, nodeId = "") {
  const timing = normalizeNodeGraphPatchTiming(runtime?.timing);
  const rate = Math.max(1, sampleRate || nodeGraphMvp.sampleRate || 44100);
  const baseHz = Math.max(0, Number(timing.tempoBpm) || 120) / 60;
  const divisionFactor = nodeGraphTransportDivisionFactor(params.divisions);
  const frequency = baseHz * divisionFactor;
  const amplitude = clampNodeSliderValue(
    nodeGraphSafeFilterNumber(params.amplitude, runtime, nodeId, null, "transport amplitude"),
    0,
    1,
  );
  const frame = Math.max(0, Number(absoluteFrame) || 0);
  const phase = frequency > 0 ? wrapNodeSliderValue((frame / rate) * frequency, 0, 1) : 0;
  const high = phase < 0.5;
  return {
    "-1..1": high ? amplitude : -amplitude,
    "0..1": high ? amplitude : 0,
  };
}

function nodeGraphRandomClockNextUnit(state, nodeId, seed) {
  const seedKey = `${nodeId}:${Math.round(Number(seed) || 0)}`;
  if (state.seedKey !== seedKey) {
    state.seedKey = seedKey;
    state.randomState = nodeGraphStableSeed(seedKey);
    state.intervalSamples = 0;
    state.phaseSamples = 0;
    state.remainingTriggerSamples = 0;
  }
  state.randomState = (Math.imul(state.randomState || 1, 1664525) + 1013904223) >>> 0;
  return state.randomState / 4294967296;
}

function nodeGraphRandomClockChooseIntervalSamples(state, params, sampleRate, runtime, nodeId) {
  const rate = Math.max(1, sampleRate || nodeGraphMvp.sampleRate || 44100);
  const minSeconds = Math.max(0, nodeGraphSafeFilterNumber(params.minSeconds, runtime, nodeId, null, "random clock min"));
  const maxSeconds = Math.max(0, nodeGraphSafeFilterNumber(params.maxSeconds, runtime, nodeId, null, "random clock max"));
  const low = Math.min(minSeconds, maxSeconds);
  const high = Math.max(minSeconds, maxSeconds);
  const random = nodeGraphRandomClockNextUnit(state, nodeId, params.seed);
  return Math.max(1, Math.round((low + (high - low) * random) * rate));
}

function nodeGraphRandomClockSample(state, reset, params, sampleRate, runtime = null, nodeId = "") {
  const safeReset = nodeGraphSafeFilterNumber(reset, runtime, nodeId, null, "random clock reset");
  const threshold = nodeGraphSafeFilterNumber(params.threshold, runtime, nodeId, null, "random clock reset threshold");
  const rate = Math.max(1, sampleRate || nodeGraphMvp.sampleRate || 44100);
  const duty = clampNodeSliderValue(
    nodeGraphSafeFilterNumber(params.duty, runtime, nodeId, null, "random clock duty"),
    0,
    1,
  );
  const triggerTime = Math.max(0, nodeGraphSafeFilterNumber(params.triggerTime, runtime, nodeId, null, "random clock trigger"));
  const level = nodeGraphSafeFilterNumber(params.level, runtime, nodeId, null, "random clock level");
  const resetEdge = state.lastReset <= threshold && safeReset > threshold;

  if (resetEdge || state.intervalSamples <= 0) {
    state.intervalSamples = nodeGraphRandomClockChooseIntervalSamples(state, params, rate, runtime, nodeId);
    state.phaseSamples = 0;
    state.remainingTriggerSamples = Math.max(1, Math.round(triggerTime * rate));
  } else if (state.phaseSamples >= state.intervalSamples) {
    state.intervalSamples = nodeGraphRandomClockChooseIntervalSamples(state, params, rate, runtime, nodeId);
    state.phaseSamples = 0;
    state.remainingTriggerSamples = Math.max(1, Math.round(triggerTime * rate));
  }

  const gateSamples = Math.round(state.intervalSamples * duty);
  const trigger = state.remainingTriggerSamples > 0 ? level : 0;
  const gate = state.phaseSamples < gateSamples ? level : 0;
  state.remainingTriggerSamples = Math.max(0, state.remainingTriggerSamples - 1);
  state.phaseSamples += 1;
  state.lastReset = safeReset;
  return {
    Gate: nodeGraphSafeFilterNumber(gate, runtime, nodeId, null, "random clock gate"),
    Trigger: nodeGraphSafeFilterNumber(trigger, runtime, nodeId, null, "random clock trigger output"),
  };
}

function nodeGraphOfflineIncomingClockRate(nodeId) {
  const connection = (Array.isArray(nodeGraphMvp?.patch?.connections) ? nodeGraphMvp.patch.connections : [])
    .find((candidate) => candidate.destinationNode === nodeId && candidate.destinationPort === "Clock");
  const sourceNode = (Array.isArray(nodeGraphMvp?.patch?.nodes) ? nodeGraphMvp.patch.nodes : [])
    .find((node) => node.id === connection?.sourceNode);
  return sourceNode?.type === "clock"
    ? Math.max(0, Number(sourceNode.params?.rate) || 0)
    : 0;
}

function nodeGraphDelayedTriggerSample(state, trigger, reset, params, sampleRate, runtime = null, nodeId = "") {
  const safeTrigger = nodeGraphSafeFilterNumber(trigger, runtime, nodeId, null, "delayed trigger trigger");
  const safeReset = nodeGraphSafeFilterNumber(reset, runtime, nodeId, null, "delayed trigger reset");
  const threshold = nodeGraphSafeFilterNumber(params.threshold, runtime, nodeId, null, "delayed trigger threshold");
  const delay = Math.max(0, nodeGraphSafeFilterNumber(params.delay, runtime, nodeId, null, "delayed trigger delay"));
  const pulseTime = Math.max(0, nodeGraphSafeFilterNumber(params.pulseTime, runtime, nodeId, null, "delayed trigger pulse"));
  const level = nodeGraphSafeFilterNumber(params.level, runtime, nodeId, null, "delayed trigger level");
  const rate = Math.max(1, sampleRate || nodeGraphMvp.sampleRate || 44100);

  if (state.lastReset <= threshold && safeReset > threshold) {
    state.hasTriggered = true;
    state.remainingSamples = 0;
    state.running = false;
    state.waitSamples = 0;
  }
  if (state.lastTrigger <= threshold && safeTrigger > threshold) {
    state.hasTriggered = false;
    state.remainingSamples = 0;
    state.running = true;
    state.waitSamples = Math.max(0, Math.round(delay * rate));
  }

  if (state.running && !state.hasTriggered) {
    if (state.waitSamples <= 0) {
      state.hasTriggered = true;
      state.running = false;
      state.remainingSamples = Math.max(1, Math.round(pulseTime * rate));
    } else {
      state.waitSamples -= 1;
    }
  }

  state.lastTrigger = safeTrigger;
  state.lastReset = safeReset;
  const output = state.remainingSamples > 0 ? level : 0;
  state.remainingSamples = Math.max(0, state.remainingSamples - 1);
  return nodeGraphSafeFilterNumber(output, runtime, nodeId, null, "delayed trigger output");
}

function nodeGraphDelayParabolSample(phase) {
  const wrapped = phase - Math.floor(phase);
  return wrapped < 0.5 ? wrapped * 4 - 1 : 3 - wrapped * 4;
}

function nodeGraphDelayInterpolateLinear(buffer, where) {
  const length = buffer.length;
  if (!length) {
    return 0;
  }
  const before = Math.floor(where) % length;
  const after = (before + 1) % length;
  const mix = where - Math.floor(where);
  return buffer[before] * (1 - mix) + buffer[after] * mix;
}

function nodeGraphDelayEffectSample(state, input, params, sampleRate, runtime = null, nodeId = "") {
  const safeRate = Math.max(1, Number(sampleRate) || 44100);
  const maxDelaySeconds = 4.25;
  const requiredSize = Math.max(2, Math.ceil(safeRate * maxDelaySeconds) + 2);
  if (!state.buffer || state.bufferSize !== requiredSize) {
    state.buffer = new Float32Array(requiredSize);
    state.bufferSize = requiredSize;
    state.position = 0;
    state.lfoPhase = 0;
    state.lfoVariationState = 0;
    state.wet = 0;
  }
  const dry = nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "delay input");
  const time = Math.max(0.001, Math.min(maxDelaySeconds, nodeGraphSafeFilterNumber(params.time, runtime, nodeId, state, "delay time")));
  const feedback = Math.max(0, Math.min(0.95, nodeGraphSafeFilterNumber(params.feedback, runtime, nodeId, state, "delay feedback")));
  const mix = Math.max(0, Math.min(1, nodeGraphSafeFilterNumber(params.mix, runtime, nodeId, state, "delay mix")));
  const level = Math.max(0, Math.min(2, nodeGraphSafeFilterNumber(params.level, runtime, nodeId, state, "delay level")));
  const modAmount = Math.max(0, Math.min(0.5, nodeGraphSafeFilterNumber(params.modAmount, runtime, nodeId, state, "delay modulation")));
  const modRate = Math.max(0, Math.min(90, nodeGraphSafeFilterNumber(params.modRate, runtime, nodeId, state, "delay mod rate")));
  const modVariation = Math.max(0, Math.min(1, nodeGraphSafeFilterNumber(params.modVariation, runtime, nodeId, state, "delay variation")));
  const mode = Math.round(nodeGraphSafeFilterNumber(params.mode, runtime, nodeId, state, "delay mode")) >= 1 ? 1 : 0;

  const variationTarget = nodeGraphHashBipolar(
    Math.floor(state.lfoPhase * 997) + state.position,
    nodeGraphStableSeed(`${nodeId}:delayVariation`),
  );
  state.lfoVariationState += (variationTarget - state.lfoVariationState) * Math.min(1, modRate / safeRate);
  const variedRate = Math.max(0, modRate * (1 + state.lfoVariationState * modVariation));
  state.lfoPhase = (state.lfoPhase + variedRate / safeRate) % 1;
  const lfo = (nodeGraphDelayParabolSample(state.lfoPhase) + 1) * 0.5;

  const delaySamples = Math.max(1, Math.min(state.bufferSize - 2, time * safeRate));
  const bufferOffset = delaySamples - delaySamples * lfo * modAmount + 1;
  state.position = (state.position + 1) % state.bufferSize;
  const readPosition = (state.position + state.bufferSize - bufferOffset) % state.bufferSize;
  const wet = nodeGraphDelayInterpolateLinear(state.buffer, readPosition);
  const write = mode ? ((0 - dry) - wet * feedback) : (dry + wet * feedback);
  state.buffer[state.position] = Math.max(-8, Math.min(8, write));
  state.wet = mode ? (dry * feedback - wet * (1 - feedback * feedback)) : wet;
  return {
    Out: (dry * (1 - mix) + state.wet * mix) * level,
    Wet: state.wet * level,
  };
}

function nodeGraphSabrinaReverbSample(state, leftInput, rightInput, params, sampleRate, runtime = null, nodeId = "") {
  const dryLeft = nodeGraphSafeFilterNumber(leftInput, runtime, nodeId, null, "Sabrina left input");
  const dryRight = nodeGraphSafeFilterNumber(rightInput, runtime, nodeId, null, "Sabrina right input");
  const dryMono = (dryLeft + dryRight) * 0.5;
  // Native WASM SIMD module missing/broken (runtime without WASM SIMD128
  // support) -- fall back to a JS port of the reverb's own scalar reference
  // algorithm instead of a dry passthrough, matching sabrinaReverbSample's
  // fallback in node-live-audio-worklet.js.
  const fallback = () => {
    if (!state.jsState) {
      state.jsState = createNodeGraphSabrinaReverbJsState(sampleRate);
    }
    return nodeGraphSabrinaReverbJsSample(state.jsState, dryLeft, dryRight, params, sampleRate);
  };
  const native = runtime?.nativeSabrinaReverbReady ? runtime?.nativeSabrinaReverb : null;
  if (!native?.soemdsp_sabrina_reverb_create || !native?.soemdsp_sabrina_reverb_process) {
    return fallback();
  }
  try {
    const safeRate = Math.max(1, Math.round(Number(sampleRate) || 44100));
    if (!state.nativeHandle || state.nativeSampleRate !== safeRate) {
      if (state.nativeHandle && native.soemdsp_sabrina_reverb_destroy) {
        native.soemdsp_sabrina_reverb_destroy(state.nativeHandle);
      }
      state.nativeHandle = native.soemdsp_sabrina_reverb_create(safeRate) || 0;
      state.nativeSampleRate = safeRate;
      state.nativeParamKey = "";
    }
    if (!state.nativeHandle) {
      return fallback();
    }
    const safeParams = {
      delaySize: Math.max(0, Math.min(1, nodeGraphSafeFilterNumber(params.delaySize, runtime, nodeId, null, "Sabrina delay size"))),
      diffusionAmount: Math.max(0, Math.min(0.98, nodeGraphSafeFilterNumber(params.diffusionAmount, runtime, nodeId, null, "Sabrina diffusion amount"))),
      diffusionSize: Math.max(0, Math.min(1, nodeGraphSafeFilterNumber(params.diffusionSize, runtime, nodeId, null, "Sabrina diffusion size"))),
      lfoAmplitude: Math.max(0, Math.min(1, nodeGraphSafeFilterNumber(params.lfoAmplitude, runtime, nodeId, null, "Sabrina lfo amplitude"))),
      lfoBaseSpeed: Math.max(0, Math.min(1, nodeGraphSafeFilterNumber(params.lfoBaseSpeed, runtime, nodeId, null, "Sabrina lfo speed"))),
      lfoVariation: Math.max(0, Math.min(1, nodeGraphSafeFilterNumber(params.lfoVariation, runtime, nodeId, null, "Sabrina lfo variation"))),
      mix: Math.max(0, Math.min(1, nodeGraphSafeFilterNumber(params.mix, runtime, nodeId, null, "Sabrina mix"))),
      recycle: Math.max(0, Math.min(0.98, nodeGraphSafeFilterNumber(params.recycle, runtime, nodeId, null, "Sabrina recycle"))),
      seed: Math.max(0, Math.min(99999, Math.round(nodeGraphSafeFilterNumber(params.seed, runtime, nodeId, null, "Sabrina seed")))),
    };
    const paramKey = [
      safeParams.mix,
      safeParams.diffusionSize,
      safeParams.diffusionAmount,
      safeParams.delaySize,
      safeParams.recycle,
      safeParams.lfoAmplitude,
      safeParams.lfoBaseSpeed,
      safeParams.lfoVariation,
    ].map((value) => Math.round(value * 1000000)).join(":") + `:${safeParams.seed}`;
    if (paramKey !== state.nativeParamKey && native.soemdsp_sabrina_reverb_set_params) {
      state.nativeParamKey = paramKey;
      native.soemdsp_sabrina_reverb_set_params(
        state.nativeHandle,
        safeParams.mix,
        safeParams.diffusionSize,
        safeParams.diffusionAmount,
        safeParams.delaySize,
        safeParams.recycle,
        safeParams.lfoAmplitude,
        safeParams.lfoBaseSpeed,
        safeParams.lfoVariation,
        safeParams.seed,
      );
    }
    native.soemdsp_sabrina_reverb_process(state.nativeHandle, dryLeft, dryRight);
    const mixLeft = nodeGraphSafeFilterNumber(native.soemdsp_sabrina_reverb_left?.(state.nativeHandle), runtime, nodeId, null, "Sabrina mix left");
    const mixRight = nodeGraphSafeFilterNumber(native.soemdsp_sabrina_reverb_right?.(state.nativeHandle), runtime, nodeId, null, "Sabrina mix right");
    return { "Left Dry": dryLeft, "Mono Dry": dryMono, "Right Dry": dryRight, "Left Mix": mixLeft, "Mono Mix": (mixLeft + mixRight) * 0.5, "Right Mix": mixRight };
  } catch (error) {
    if (runtime) {
      runtime.nativeSabrinaReverbReady = false;
    }
    if (state.nativeHandle && native.soemdsp_sabrina_reverb_destroy) {
      native.soemdsp_sabrina_reverb_destroy(state.nativeHandle);
    }
    state.nativeHandle = 0;
    state.nativeParamKey = "";
    return fallback();
  }
}

function nodeGraphPllSample(state, signalIn, cvIn, cvConnected, params, sampleRate, runtime = null, nodeId = "") {
  const silent = { "VCO Out": 0, "PC Out": 0, "LPF Out": 0, Locked: 0 };
  const native = runtime?.nativePllReady ? runtime?.nativePll : null;
  if (!native?.soemdsp_pll_create || !native?.soemdsp_pll_process) return silent;
  try {
    const safeRate = Math.max(1, Math.round(Number(sampleRate) || 44100));
    if (!state.nativeHandle || state.nativeSampleRate !== safeRate) {
      if (state.nativeHandle && native.soemdsp_pll_destroy) {
        native.soemdsp_pll_destroy(state.nativeHandle);
      }
      state.nativeHandle = native.soemdsp_pll_create(safeRate) || 0;
      state.nativeSampleRate = safeRate;
      state.nativeParamKey = "";
    }
    if (!state.nativeHandle) return silent;
    const range  = Math.max(0, Math.min(2, Math.round(Number(params.range)  || 1)));
    const offset = Math.max(0, Math.min(10, Number(params.offset) || 5));
    const type   = Math.max(0, Math.min(2, Math.round(Number(params.type)   || 1)));
    const frequ  = Math.max(0.1, Number(params.frequ) || 10);
    const paramKey = `${range}:${Math.round(offset * 1000)}:${type}:${Math.round(frequ * 1000)}`;
    if (paramKey !== state.nativeParamKey && native.soemdsp_pll_set_params) {
      state.nativeParamKey = paramKey;
      native.soemdsp_pll_set_params(state.nativeHandle, safeRate, range, offset, type, frequ);
    }
    const safeSig = nodeGraphSafeFilterNumber(signalIn, runtime, nodeId, null, "PLL signal in");
    const safeCv  = Math.max(0, Math.min(1, nodeGraphSafeFilterNumber(cvIn, runtime, nodeId, null, "PLL cv in")));
    native.soemdsp_pll_process(state.nativeHandle, safeSig, safeCv, cvConnected);
    return {
      "VCO Out": nodeGraphSafeFilterNumber(native.soemdsp_pll_vco_out?.(state.nativeHandle), runtime, nodeId, null, "PLL vco out"),
      "PC Out":  nodeGraphSafeFilterNumber(native.soemdsp_pll_pc_out?.(state.nativeHandle),  runtime, nodeId, null, "PLL pc out"),
      "LPF Out": nodeGraphSafeFilterNumber(native.soemdsp_pll_lpf_out?.(state.nativeHandle), runtime, nodeId, null, "PLL lpf out"),
      Locked:    nodeGraphSafeFilterNumber(native.soemdsp_pll_locked?.(state.nativeHandle),   runtime, nodeId, null, "PLL locked"),
    };
  } catch {
    if (runtime) runtime.nativePllReady = false;
    if (state.nativeHandle && native.soemdsp_pll_destroy) native.soemdsp_pll_destroy(state.nativeHandle);
    state.nativeHandle = 0;
    return silent;
  }
}

function nodeGraphHelmholtzPitchView(frequencyHz) {
  if (!(frequencyHz > 0)) return -1;
  const minHz = 80;
  const octaves = 4;
  const clampedHz = Math.max(minHz, Math.min(minHz * Math.pow(2, octaves), frequencyHz));
  const norm = Math.log2(clampedHz / minHz) / octaves;
  return norm * 2 - 1;
}

function nodeGraphHelmholtzSample(state, input, params, inputConnected, sampleRate, runtime = null, nodeId = "") {
  const silent = { Frequency: 0, Fidelity: 0, "Pitch View": -1 };
  if (!inputConnected) {
    if (state.nativeHandle && runtime?.nativeHelmholtz?.soemdsp_helmholtz_destroy) {
      runtime.nativeHelmholtz.soemdsp_helmholtz_destroy(state.nativeHandle);
    }
    state.nativeHandle = 0;
    state.nativeSampleRate = 0;
    state.nativeParamKey = "";
    return silent;
  }
  const native = runtime?.nativeHelmholtzReady ? runtime?.nativeHelmholtz : null;
  if (!native?.soemdsp_helmholtz_create || !native?.soemdsp_helmholtz_process) return silent;
  try {
    const safeRate = Math.max(1, Math.round(Number(sampleRate) || 44100));
    if (!state.nativeHandle || state.nativeSampleRate !== safeRate) {
      if (state.nativeHandle && native.soemdsp_helmholtz_destroy) {
        native.soemdsp_helmholtz_destroy(state.nativeHandle);
      }
      state.nativeHandle = native.soemdsp_helmholtz_create(safeRate) || 0;
      state.nativeSampleRate = safeRate;
      state.nativeParamKey = "";
    }
    if (!state.nativeHandle) return silent;
    const windowSize = Math.max(128, Math.min(1024, Math.round(Number(params.windowSize) || 512)));
    const threshold = Math.max(0.5, Math.min(0.999, Number(params.threshold) || 0.93));
    const paramKey = `${windowSize}:${Math.round(threshold * 1000)}`;
    if (paramKey !== state.nativeParamKey && native.soemdsp_helmholtz_set_params) {
      state.nativeParamKey = paramKey;
      native.soemdsp_helmholtz_set_params(state.nativeHandle, safeRate, windowSize, threshold);
    }
    const safeIn = nodeGraphSafeFilterNumber(input, runtime, nodeId, null, "pitch detector input");
    native.soemdsp_helmholtz_process(state.nativeHandle, safeIn);
    const frequency = nodeGraphSafeFilterNumber(native.soemdsp_helmholtz_frequency?.(state.nativeHandle), runtime, nodeId, null, "pitch detector frequency");
    return {
      Frequency: frequency,
      Fidelity: nodeGraphSafeFilterNumber(native.soemdsp_helmholtz_fidelity?.(state.nativeHandle), runtime, nodeId, null, "pitch detector fidelity"),
      "Pitch View": nodeGraphHelmholtzPitchView(frequency),
    };
  } catch {
    if (runtime) runtime.nativeHelmholtzReady = false;
    if (state.nativeHandle && native.soemdsp_helmholtz_destroy) native.soemdsp_helmholtz_destroy(state.nativeHandle);
    state.nativeHandle = 0;
    return silent;
  }
}

function nodeGraphSampleHoldSample(state, input, trigger, threshold, sampleFrequency, sampleRate, hasInConnected, runtime = null, nodeId = "") {
  nodeGraphResetSeededState(state.noise, nodeId, 0, "sampleHoldNoise");
  const safeInput = hasInConnected
    ? nodeGraphSafeFilterNumber(input, runtime, nodeId, null, "sample hold input")
    : nodeGraphNextSeededBipolar(state.noise);
  const safeTrigger = nodeGraphSafeFilterNumber(trigger, runtime, nodeId, null, "sample hold trigger");
  const safeThreshold = nodeGraphSafeFilterNumber(threshold, runtime, nodeId, null, "sample hold threshold");
  const safeFreq = Math.max(0, Number(sampleFrequency) || 0);
  const safeRate = Math.max(1, Number(sampleRate) || 44100);
  let internalFire = false;
  if (safeFreq > 0) {
    state.clockPhase += safeFreq / safeRate;
    if (state.clockPhase >= 1) {
      state.clockPhase -= Math.floor(state.clockPhase);
      internalFire = true;
    }
  }
  if ((state.lastTrigger <= safeThreshold && safeTrigger > safeThreshold) || internalFire) {
    state.held = safeInput;
  }
  state.lastTrigger = safeTrigger;
  return nodeGraphSafeFilterNumber(state.held, runtime, nodeId, null, "sample hold output");
}

function nodeGraphStepSequencerSample(state, trigger, reset, params, runtime = null, nodeId = "") {
  const safeTrigger = nodeGraphSafeFilterNumber(trigger, runtime, nodeId, null, "step sequencer trigger");
  const safeReset = nodeGraphSafeFilterNumber(reset, runtime, nodeId, null, "step sequencer reset");
  const threshold = nodeGraphSafeFilterNumber(params.threshold, runtime, nodeId, null, "step sequencer threshold");
  const stepCount = Math.max(1, Math.min(8, Math.round(nodeGraphSafeFilterNumber(params.steps, runtime, nodeId, null, "step sequencer steps"))));
  const level = nodeGraphSafeFilterNumber(params.level, runtime, nodeId, null, "step sequencer level");
  const values = params.values.map((value) => nodeGraphSafeFilterNumber(value, runtime, nodeId, null, "step sequencer value"));
  if (state.index >= stepCount) {
    state.index %= stepCount;
  }
  if (state.lastReset <= threshold && safeReset > threshold) {
    state.index = 0;
    state.out = values[0] || 0;
  }
  if (state.lastTrigger <= threshold && safeTrigger > threshold) {
    state.out = values[state.index] || 0;
    state.index = (state.index + 1) % stepCount;
  }
  state.gate = safeTrigger > threshold ? 1 : 0;
  state.lastTrigger = safeTrigger;
  state.lastReset = safeReset;
  return {
    Gate: state.gate,
    Out: nodeGraphSafeFilterNumber(state.out * level, runtime, nodeId, null, "step sequencer output"),
  };
}

function nodeGraphTriggerCounterSample(state, trigger, reset, params, sampleRate, runtime = null, nodeId = "") {
  const safeTrigger = nodeGraphSafeFilterNumber(trigger, runtime, nodeId, null, "trigger counter trigger");
  const safeReset = nodeGraphSafeFilterNumber(reset, runtime, nodeId, null, "trigger counter reset");
  const threshold = nodeGraphSafeFilterNumber(params.threshold, runtime, nodeId, null, "trigger counter threshold");
  const countMax = Math.max(1, nodeGraphSafeFilterNumber(params.countMax, runtime, nodeId, null, "trigger counter max"));
  const increment = Math.max(0, nodeGraphSafeFilterNumber(params.increment, runtime, nodeId, null, "trigger counter increment"));
  const pulseTime = Math.max(0, nodeGraphSafeFilterNumber(params.pulseTime, runtime, nodeId, null, "trigger counter pulse"));
  const level = nodeGraphSafeFilterNumber(params.level, runtime, nodeId, null, "trigger counter level");
  if (state.lastReset <= threshold && safeReset > threshold) {
    state.count = 0;
    state.remainingSamples = 0;
  }
  if (state.lastTrigger <= threshold && safeTrigger > threshold) {
    state.count += increment;
    if (state.count >= countMax) {
      state.count = countMax > 0 ? state.count % countMax : 0;
      state.remainingSamples = Math.max(1, Math.round(pulseTime * Math.max(1, sampleRate)));
    }
  }
  state.lastTrigger = safeTrigger;
  state.lastReset = safeReset;
  const pulse = state.remainingSamples > 0 ? level : 0;
  state.remainingSamples = Math.max(0, state.remainingSamples - 1);
  return {
    Count: nodeGraphSafeFilterNumber(clampNodeSliderValue(state.count / countMax, 0, 1) * level, runtime, nodeId, null, "trigger counter count"),
    Pulse: nodeGraphSafeFilterNumber(pulse, runtime, nodeId, null, "trigger counter pulse output"),
  };
}

function nodeGraphTriggerDividerSample(state, trigger, reset, params, sampleRate, runtime = null, nodeId = "") {
  const safeTrigger = nodeGraphSafeFilterNumber(trigger, runtime, nodeId, null, "trigger divider trigger");
  const safeReset = nodeGraphSafeFilterNumber(reset, runtime, nodeId, null, "trigger divider reset");
  const threshold = nodeGraphSafeFilterNumber(params.threshold, runtime, nodeId, null, "trigger divider threshold");
  const division = Math.max(1, Math.min(64, Math.round(nodeGraphSafeFilterNumber(params.division, runtime, nodeId, null, "trigger divider division"))));
  const pulseTime = Math.max(0, nodeGraphSafeFilterNumber(params.pulseTime, runtime, nodeId, null, "trigger divider pulse"));
  const level = nodeGraphSafeFilterNumber(params.level, runtime, nodeId, null, "trigger divider level");
  if (state.lastReset <= threshold && safeReset > threshold) {
    state.count = 0;
    state.remainingSamples = 0;
  }
  if (state.lastTrigger <= threshold && safeTrigger > threshold) {
    state.count = (state.count + 1) % division;
    if (state.count === 0) {
      state.remainingSamples = Math.max(1, Math.round(pulseTime * Math.max(1, sampleRate)));
    }
  }
  state.lastTrigger = safeTrigger;
  state.lastReset = safeReset;
  const output = state.remainingSamples > 0 ? level : 0;
  state.remainingSamples = Math.max(0, state.remainingSamples - 1);
  return nodeGraphSafeFilterNumber(output, runtime, nodeId, null, "trigger divider output");
}

const nodeGraphPluckEnvelopeMinValue = 1e-8;
const nodeGraphPluckEnvelopeMaxFeedback = 1 - 1e-6;

function nodeGraphExponentialCurve(value, skew) {
  const safeValue = clampNodeSliderValue(Number(value) || 0, 0, 1);
  const safeSkew = clampNodeSliderValue(Number(skew) || 0, -0.99, 0.99);
  if (safeSkew === 0) {
    return safeValue;
  }
  const c = 0.5 * (safeSkew + 1);
  const a = 2 * Math.log10((1 - c) / c);
  const denom = 1 - Math.exp(a);
  return denom === 0 ? safeValue : (1 - Math.exp(safeValue * a)) / denom;
}

function nodeGraphPluckPrepareForDecay(state, rate, peak) {
  state.phasor = 0;
  state.autoReleasePhasor = 0;
  state.currentValue = peak;
  state.decayIncrement = (state.currentValue - 1) / Math.max(1, rate) / 50;
}

function nodeGraphPluckTriggerAttack(state, params, rate) {
  const period = 1 / Math.max(1, rate);
  const velocity = clampNodeSliderValue(params.velocity, 0, 1);
  const sensitivity = clampNodeSliderValue(params.velocitySensitivity, 0, 1);
  const peak = (1 - sensitivity) + velocity * sensitivity;
  state.secondsPassed = 0;
  state.state = "delay";
  if (params.delayTime < period) {
    if (params.attackFeedback <= nodeGraphPluckEnvelopeMinValue) {
      state.state = "decay";
      nodeGraphPluckPrepareForDecay(state, rate, peak);
    } else {
      state.state = "attack";
    }
  }
  state.peak = peak;
}

function nodeGraphPluckTriggerRelease(state, rate) {
  if (state.state !== "release") {
    state.state = "release";
    state.releaseIncrement = state.currentValue / Math.max(1, rate) / 50;
  }
}

function nodeGraphPluckDecayFeedback(state, params) {
  let finalDecayMod = params.endingDecay;
  if (state.phasor < 1) {
    const shaped = nodeGraphExponentialCurve(state.phasor, params.decayModCurve || -1e-8);
    finalDecayMod = params.decay + params.decayModStart + shaped * (params.decayModEnd - params.decayModStart);
  }
  return Math.min(nodeGraphPluckEnvelopeMaxFeedback, Math.exp(-finalDecayMod * 10));
}

function nodeGraphPluckEnvelopeSample(state, trigger, release, params, sampleRate, runtime = null, nodeId = "") {
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const period = 1 / rate;
  const safeTrigger = nodeGraphSafeFilterNumber(trigger, runtime, nodeId, null, "pluck trigger");
  const safeRelease = nodeGraphSafeFilterNumber(release, runtime, nodeId, null, "pluck release");
  const read = (key, fallback, min = -Infinity, max = Infinity) => clampNodeSliderValue(
    nodeGraphSafeFilterNumber(params[key] ?? fallback, runtime, nodeId, null, `pluck ${key}`),
    min,
    max,
  );
  const values = {
    attackFeedback: read("attackFeedback", 0.002, 0),
    autoReleaseTime: read("autoReleaseTime", 0.08, 0),
    decay: read("decay", 0.35, 0.1, 1),
    decayModCurve: read("decayModCurve", 0, -1, 1),
    decayModEnd: read("decayModEnd", 0.55, 0.01, 3),
    decayModFrequency: read("decayModFrequency", 1.5, 0, 100),
    decayModStart: read("decayModStart", 0.08, 0.001, 1.8),
    delayTime: read("delayTime", 0, 0),
    endingDecay: read("endingDecay", 0.8, 0, 1.4),
    level: read("level", 1, 0, 1),
    releaseFeedback: read("releaseFeedback", 0.35, 0, 1),
    velocity: read("velocity", 1, 0, 1),
    velocitySensitivity: read("velocitySensitivity", 0, 0, 1),
  };

  if (state.lastTrigger <= 0 && safeTrigger > 0) {
    nodeGraphPluckTriggerAttack(state, values, rate);
  }
  if (state.lastRelease <= 0 && safeRelease > 0) {
    nodeGraphPluckTriggerRelease(state, rate);
  }
  state.lastTrigger = safeTrigger;
  state.lastRelease = safeRelease;

  const attackFeedbackAmp = 1 / (Math.max(values.attackFeedback, nodeGraphPluckEnvelopeMinValue) * rate);
  const releaseFeedbackAmp = Math.min(nodeGraphPluckEnvelopeMaxFeedback, Math.exp(-values.releaseFeedback * 10));
  const autoReleaseIncrement = values.autoReleaseTime <= nodeGraphPluckEnvelopeMinValue
    ? 0
    : 1 / (Math.max(values.autoReleaseTime, nodeGraphPluckEnvelopeMinValue) * rate);
  const phasorIncrement = values.decayModFrequency / rate;

  switch (state.state) {
    case "delay":
      state.secondsPassed += period;
      if (state.secondsPassed >= values.delayTime) {
        state.state = "attack";
      }
      break;
    case "attack":
      state.currentValue += period + state.currentValue * attackFeedbackAmp;
      if (state.currentValue >= state.peak) {
        state.state = "decay";
        nodeGraphPluckPrepareForDecay(state, rate, state.peak);
      }
      break;
    case "decay":
      state.currentValue -= state.decayIncrement + state.currentValue * state.currentValue * nodeGraphPluckDecayFeedback(state, values);
      state.phasor += phasorIncrement;
      state.autoReleasePhasor += autoReleaseIncrement;
      if (autoReleaseIncrement > 0 && state.autoReleasePhasor >= 1) {
        nodeGraphPluckTriggerRelease(state, rate);
      }
      if (state.currentValue < 0) {
        state.currentValue = 0;
        state.secondsPassed = 0;
        state.phasor = 0;
        state.autoReleasePhasor = 0;
        state.state = "off";
      }
      break;
    case "release":
      state.currentValue -= state.releaseIncrement + state.currentValue * state.currentValue * releaseFeedbackAmp;
      if (state.currentValue <= 0) {
        state.currentValue = 0;
        state.secondsPassed = 0;
        state.phasor = 0;
        state.autoReleasePhasor = 0;
        state.state = "off";
      }
      break;
    case "off":
    default:
      break;
  }
  return nodeGraphSafeFilterNumber(state.currentValue * values.level, runtime, nodeId, null, "pluck output");
}

function nodeGraphSeedKey(nodeId, seed, salt) {
  return `${nodeId}.${salt}.${Math.max(0, Math.round(Number(seed) || 0))}`;
}

function nodeGraphResetSeededState(state, nodeId, seed, salt) {
  const key = nodeGraphSeedKey(nodeId, seed, salt);
  if (state.seedKey !== key) {
    state.seedKey = key;
    state.seed = nodeGraphStableSeed(key);
    state.gaussianSpare = null;
    state.brown = 0;
    state.pink = [0, 0, 0, 0, 0, 0, 0];
    if (Object.hasOwn(state, "out")) {
      state.out = 0;
    }
    if (state.lowpass) {
      state.lowpass.outputBuffer = 0;
    }
  }
}

function nodeGraphNextSeededUnipolar(state) {
  state.seed = (Math.imul(1664525, state.seed || 0x12345678) + 1013904223) >>> 0;
  return state.seed / 0xffffffff;
}

function nodeGraphNextSeededBipolar(state) {
  return nodeGraphNextSeededUnipolar(state) * 2 - 1;
}

function nodeGraphNextSeededGaussian(state) {
  if (state.gaussianSpare !== null && state.gaussianSpare !== undefined) {
    const spare = state.gaussianSpare;
    state.gaussianSpare = null;
    return spare;
  }
  const u1 = Math.max(1e-12, nodeGraphNextSeededUnipolar(state));
  const u2 = nodeGraphNextSeededUnipolar(state);
  const magnitude = Math.sqrt(-2 * Math.log(u1));
  const angle = nodeGraphTau * u2;
  state.gaussianSpare = magnitude * Math.sin(angle);
  return magnitude * Math.cos(angle);
}

function nodeGraphNoiseGeneratorChannelSample(state, mode, mean, deviation) {
  const white = nodeGraphNextSeededBipolar(state);
  if (mode === 1) {
    return mean + nodeGraphNextSeededGaussian(state) * deviation;
  }
  if (mode === 2) {
    state.brown = clampNodeSliderValue(state.brown + white * Math.max(0.001, deviation) * 0.05, -1, 1);
    return mean + state.brown;
  }
  if (mode === 3) {
    state.pink[0] = 0.99886 * state.pink[0] + white * 0.0555179;
    state.pink[1] = 0.99332 * state.pink[1] + white * 0.0750759;
    state.pink[2] = 0.969 * state.pink[2] + white * 0.153852;
    state.pink[3] = 0.8665 * state.pink[3] + white * 0.3104856;
    state.pink[4] = 0.55 * state.pink[4] + white * 0.5329522;
    state.pink[5] = -0.7616 * state.pink[5] - white * 0.016898;
    const out = mean + (state.pink[0] + state.pink[1] + state.pink[2] + state.pink[3] + state.pink[4] + state.pink[5] + state.pink[6] + white * 0.5362) * 0.11;
    state.pink[6] = white * 0.115926;
    return out;
  }
  if (mode === 4) {
    return Math.abs(white) > 0.94 ? mean + Math.sign(white) * deviation : mean;
  }
  return mean + white * deviation;
}

function nodeGraphNoiseGeneratorSample(state, params, runtime = null, nodeId = "") {
  nodeGraphResetSeededState(state.left, `${nodeId}:left`, params.seed, "noiseGenerator");
  nodeGraphResetSeededState(state.right, `${nodeId}:right`, params.seed, "noiseGenerator");
  const mode = Math.max(0, Math.min(4, Math.round(nodeGraphSafeFilterNumber(params.mode, runtime, nodeId, null, "noise generator mode"))));
  const mean = nodeGraphSafeFilterNumber(params.mean, runtime, nodeId, null, "noise generator mean");
  const deviation = Math.max(0, nodeGraphSafeFilterNumber(params.deviation, runtime, nodeId, null, "noise generator deviation"));
  const level = nodeGraphSafeFilterNumber(params.level, runtime, nodeId, null, "noise generator level");
  const left = clampNodeSliderValue(nodeGraphNoiseGeneratorChannelSample(state.left, mode, mean, deviation), -1, 1) * level;
  const right = clampNodeSliderValue(nodeGraphNoiseGeneratorChannelSample(state.right, mode, mean, deviation), -1, 1) * level;
  return {
    "Left Out": nodeGraphSafeFilterNumber(left, runtime, nodeId, null, "noise generator left out"),
    "Right Out": nodeGraphSafeFilterNumber(right, runtime, nodeId, null, "noise generator right out"),
  };
}

function nodeGraphRationalCurve(value, skew) {
  const t = clampNodeSliderValue(Number(value) || 0, 0, 1);
  const safeSkew = clampNodeSliderValue(Number(skew) || 0, -0.999, 0.999);
  return ((1 + safeSkew) * t) / (1 - safeSkew + 2 * safeSkew * t);
}

function nodeGraphRandomWalkSample(state, params, sampleRate, runtime = null, nodeId = "") {
  nodeGraphResetSeededState(state, nodeId, params.seed, "randomWalk");
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const method = Math.max(0, Math.min(3, Math.round(nodeGraphSafeFilterNumber(params.method, runtime, nodeId, null, "random walk method"))));
  const frequency = Math.max(0, nodeGraphSafeFilterNumber(params.frequency, runtime, nodeId, null, "random walk frequency"));
  const jitter = Math.max(0, nodeGraphSafeFilterNumber(params.jitter, runtime, nodeId, null, "random walk jitter"));
  const level = nodeGraphSafeFilterNumber(params.level, runtime, nodeId, null, "random walk level");
  const noise = nodeGraphNextSeededBipolar(state);
  const increment = clampNodeSliderValue(frequency / rate, 0, 1);
  const jitterInc = clampNodeSliderValue(jitter / rate, 0, 1);
  const stepSize = clampNodeSliderValue(increment + nodeGraphRationalCurve(jitterInc, 0.99), 0, 1);
  const averageIncrement = (jitterInc + increment) * 0.5;
  const whiteNoiseMix = averageIncrement >= 0.9
    ? nodeGraphRationalCurve((averageIncrement - 0.9) / 0.1, -0.7)
    : 0;
  const randomMix = 1 - whiteNoiseMix;

  if (method === 0) {
    return nodeGraphSafeFilterNumber(noise * level, runtime, nodeId, null, "random walk white output");
  }
  if (method === 1) {
    return nodeGraphOnePoleLowpassSample(state.lowpass, noise, frequency, rate, runtime, nodeId) * level;
  }
  const step = method === 3 ? (noise > 0 ? stepSize : -stepSize) : noise * stepSize;
  state.out = clampNodeSliderValue(state.out + step, -1, 1);
  const mixed = state.out * randomMix + noise * whiteNoiseMix;
  return nodeGraphSafeFilterNumber(
    nodeGraphOnePoleLowpassSample(state.lowpass, mixed, frequency, rate, runtime, nodeId) * level,
    runtime,
    nodeId,
    null,
    "random walk output",
  );
}

function nodeGraphHashBipolar(index, seed) {
  let value = (Math.trunc(index) ^ Math.trunc(seed)) >>> 0;
  value = Math.imul(value ^ (value >>> 16), 2246822507) >>> 0;
  value = Math.imul(value ^ (value >>> 13), 3266489909) >>> 0;
  value = (value ^ (value >>> 16)) >>> 0;
  return (value / 0xffffffff) * 2 - 1;
}

function nodeGraphSmoothNoise1d(x, seed) {
  const left = Math.floor(x);
  const frac = x - left;
  const smooth = frac * frac * (3 - 2 * frac);
  const a = nodeGraphHashBipolar(left, seed);
  const b = nodeGraphHashBipolar(left + 1, seed);
  return a + (b - a) * smooth;
}

function nodeGraphFractalBrownianNoiseAxisState(state, axis) {
  const key = String(axis || "x");
  if (!state.axes || typeof state.axes !== "object") {
    state.axes = {};
  }
  if (!state.axes[key]) {
    state.axes[key] = { seedKey: "", time: 0 };
  }
  return state.axes[key];
}

function nodeGraphFractalBrownianNoiseSample(state, params, sampleRate, runtime = null, nodeId = "", axis = "x", options = {}) {
  const axisState = nodeGraphFractalBrownianNoiseAxisState(state, axis);
  const rate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
  const seed = Math.max(0, Math.round(nodeGraphSafeFilterNumber(params.seed, runtime, nodeId, null, "fbm seed")));
  const seedKey = nodeGraphSeedKey(nodeId, seed, `fractalBrownianNoise:${axis}`);
  if (axisState.seedKey !== seedKey) {
    axisState.seedKey = seedKey;
    axisState.time = 0;
  }
  const frequency = Math.max(0, nodeGraphSafeFilterNumber(params.frequency, runtime, nodeId, null, "fbm frequency"));
  const octaves = Math.max(1, Math.min(8, Math.round(nodeGraphSafeFilterNumber(params.octaves, runtime, nodeId, null, "fbm octaves"))));
  const persistence = clampNodeSliderValue(nodeGraphSafeFilterNumber(params.persistence, runtime, nodeId, null, "fbm persistence"), 0, 0.99);
  const scale = Math.max(0.000001, nodeGraphSafeFilterNumber(params.scale, runtime, nodeId, null, "fbm scale"));
  const level = nodeGraphSafeFilterNumber(params.level, runtime, nodeId, null, "fbm level");
  let total = 0;
  let amplitude = 1;
  let noiseFrequency = 1;
  let maxValue = 0;
  const baseSeed = nodeGraphStableSeed(seedKey);
  for (let i = 0; i < octaves; i += 1) {
    total += nodeGraphSmoothNoise1d(axisState.time * scale * noiseFrequency, baseSeed + i * 1013) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    noiseFrequency *= 2;
  }
  axisState.time += frequency / rate;
  const normalized = maxValue > 0 ? total / maxValue : 0;
  return nodeGraphSafeFilterNumber(options.raw ? normalized : normalized * level, runtime, nodeId, null, "fbm output");
}

function nodeGraphFractalBrownianNoiseVector(state, params, sampleRate, runtime = null, nodeId = "", reset = 0) {
  const resetHigh = Number(reset) > 0.5;
  if (resetHigh && !state.resetWasHigh) {
    for (const axisState of Object.values(state.axes || {})) {
      axisState.time = 0;
    }
  }
  state.resetWasHigh = resetHigh;
  const rawX = nodeGraphFractalBrownianNoiseSample(state, params, sampleRate, runtime, nodeId, "x", { raw: true });
  const rawY = nodeGraphFractalBrownianNoiseSample(state, params, sampleRate, runtime, nodeId, "y", { raw: true });
  const rawZ = nodeGraphFractalBrownianNoiseSample(state, params, sampleRate, runtime, nodeId, "z", { raw: true });
  const level = nodeGraphSafeFilterNumber(params.level, runtime, nodeId, null, "fbm level");
  return {
    "Out X": nodeGraphSafeFilterNumber(rawX * level, runtime, nodeId, null, "fbm output"),
    "Out Y": nodeGraphSafeFilterNumber(rawY * level, runtime, nodeId, null, "fbm output"),
    "Out Z": nodeGraphSafeFilterNumber(rawZ * level, runtime, nodeId, null, "fbm output"),
    "Out X Raw": rawX,
    "Out Y Raw": rawY,
    "Out Z Raw": rawZ,
  };
}

function nodeGraphExpAdsrCalcCoef(rate, targetRatio) {
  const safeRate = Math.max(0, Number(rate) || 0);
  const safeRatio = Math.max(0.000000001, Number(targetRatio) || 0.000000001);
  return safeRate <= 0 ? 0 : Math.exp(-Math.log((1 + safeRatio) / safeRatio) / safeRate);
}

function nodeGraphExpAdsrTriggerAttack(state, delay, attack, sampleRate) {
  const period = 1 / Math.max(1, sampleRate);
  if (delay < period) {
    if (attack <= period) {
      state.state = "decay";
      state.out = 1;
    } else {
      state.state = "attack";
    }
    return;
  }
  if (state.out <= 0.000001) {
    state.out = 0;
    state.secondsPassed = 0;
  }
  state.state = "delay";
}

function nodeGraphExpAdsrSample(state, gate, params, sampleRate, runtime = null, nodeId = "") {
  const safeGate = nodeGraphSafeFilterNumber(gate, runtime, nodeId, null, "exp adsr gate");
  const delay = Math.max(0, nodeGraphSafeFilterNumber(params.delay, runtime, nodeId, null, "exp adsr delay"));
  const attack = Math.max(0, nodeGraphSafeFilterNumber(params.attack, runtime, nodeId, null, "exp adsr attack"));
  const decay = Math.max(0, nodeGraphSafeFilterNumber(params.decay, runtime, nodeId, null, "exp adsr decay"));
  const sustain = clampNodeSliderValue(
    nodeGraphSafeFilterNumber(params.sustain, runtime, nodeId, null, "exp adsr sustain"),
    0,
    1,
  );
  const release = Math.max(0, nodeGraphSafeFilterNumber(params.release, runtime, nodeId, null, "exp adsr release"));
  const attackShape = Math.max(0.000000001, nodeGraphSafeFilterNumber(params.attackShape, runtime, nodeId, null, "exp adsr attack shape"));
  const releaseShape = Math.max(0.000000001, nodeGraphSafeFilterNumber(params.releaseShape, runtime, nodeId, null, "exp adsr release shape"));
  const level = nodeGraphSafeFilterNumber(params.level, runtime, nodeId, null, "exp adsr level");
  const looping = nodeGraphSafeFilterNumber(params.loop, runtime, nodeId, null, "exp adsr loop") >= 0.5;
  const rate = Math.max(1, sampleRate || nodeGraphMvp.sampleRate || 44100);
  const period = 1 / rate;

  if (state.lastGate <= 0 && safeGate > 0) {
    nodeGraphExpAdsrTriggerAttack(state, delay, attack, rate);
  } else if (state.lastGate > 0 && safeGate <= 0) {
    state.state = "release";
  }
  state.lastGate = safeGate;

  const attackCoef = nodeGraphExpAdsrCalcCoef(attack * rate, attackShape);
  const decayCoef = nodeGraphExpAdsrCalcCoef(decay * rate, releaseShape);
  const releaseCoef = nodeGraphExpAdsrCalcCoef(release * rate, releaseShape);
  const attackBase = (1 + attackShape) * (1 - attackCoef);
  const decayBase = (sustain - releaseShape) * (1 - decayCoef);
  const releaseBase = -releaseShape * (1 - releaseCoef);

  switch (state.state) {
    case "delay":
      state.secondsPassed += period;
      if (state.secondsPassed >= delay) {
        state.state = attack <= period ? "decay" : "attack";
        state.secondsPassed = 0;
        if (attack <= period) {
          state.out = 1;
        }
      }
      break;
    case "attack":
      state.out = attackBase + state.out * attackCoef;
      if (state.out >= 1) {
        state.out = 1;
        state.state = "decay";
      }
      break;
    case "decay":
      state.out = decayBase + state.out * decayCoef;
      if (state.out <= sustain) {
        state.out = sustain;
        state.state = "sustain";
      }
      break;
    case "sustain":
      state.out = sustain;
      if (looping) {
        nodeGraphExpAdsrTriggerAttack(state, delay, attack, rate);
      }
      break;
    case "release":
      state.out = releaseBase + state.out * releaseCoef;
      if (state.out <= 0) {
        state.out = 0;
        state.state = "off";
      }
      break;
    case "off":
    default:
      state.out = 0;
      break;
  }

  return nodeGraphSafeFilterNumber(state.out * level, runtime, nodeId, null, "exp adsr output");
}

function nodeGraphLinearEnvelopeTriggerAttack(state, delay, attack, sampleRate) {
  const period = 1 / Math.max(1, sampleRate);
  if (delay < period) {
    if (attack <= period) {
      state.state = "decay";
      state.out = 1;
    } else {
      state.state = "attack";
    }
    return;
  }
  if (state.out <= 0.000001) {
    state.out = 0;
    state.secondsPassed = 0;
  }
  state.state = "delay";
}

function nodeGraphLinearEnvelopeSample(state, gate, params, sampleRate, runtime = null, nodeId = "") {
  const safeGate = nodeGraphSafeFilterNumber(gate, runtime, nodeId, null, "linear envelope gate");
  const delay = Math.max(0, nodeGraphSafeFilterNumber(params.delay, runtime, nodeId, null, "linear envelope delay"));
  const attack = Math.max(0, nodeGraphSafeFilterNumber(params.attack, runtime, nodeId, null, "linear envelope attack"));
  const decay = Math.max(0, nodeGraphSafeFilterNumber(params.decay, runtime, nodeId, null, "linear envelope decay"));
  const sustain = clampNodeSliderValue(nodeGraphSafeFilterNumber(params.sustain, runtime, nodeId, null, "linear envelope sustain"), 0, 1);
  const release = Math.max(0, nodeGraphSafeFilterNumber(params.release, runtime, nodeId, null, "linear envelope release"));
  const level = nodeGraphSafeFilterNumber(params.level, runtime, nodeId, null, "linear envelope level");
  const looping = nodeGraphSafeFilterNumber(params.loop, runtime, nodeId, null, "linear envelope loop") >= 0.5;
  const rate = Math.max(1, sampleRate || nodeGraphMvp.sampleRate || 44100);
  const period = 1 / rate;

  if (state.lastGate <= 0 && safeGate > 0) {
    nodeGraphLinearEnvelopeTriggerAttack(state, delay, attack, rate);
  } else if (state.lastGate > 0 && safeGate <= 0) {
    state.state = "release";
    state.releaseDecrement = state.out * period / Math.max(release, period);
  }
  state.lastGate = safeGate;

  const attackIncrement = Math.min(period / Math.max(attack, period), 1);
  const decayDecrement = (1 - sustain) * period / Math.max(decay, period);

  switch (state.state) {
    case "delay":
      state.secondsPassed += period;
      if (state.secondsPassed >= delay) {
        state.state = attack <= period ? "decay" : "attack";
        state.secondsPassed = 0;
        if (attack <= period) {
          state.out = 1;
        }
      }
      break;
    case "attack":
      state.out += attackIncrement;
      if (state.out >= 1) {
        state.out = 1;
        state.state = "decay";
      }
      break;
    case "decay":
      state.out -= decayDecrement;
      if (state.out <= sustain) {
        state.out = sustain;
        state.state = "sustain";
      }
      break;
    case "sustain":
      if (looping) {
        state.state = "attack";
      }
      state.out = sustain;
      break;
    case "release":
      state.out -= state.releaseDecrement;
      if (state.out <= 0) {
        state.out = 0;
        state.state = "off";
        state.secondsPassed = 0;
      }
      break;
    case "off":
    default:
      break;
  }

  return nodeGraphSafeFilterNumber(clampNodeSliderValue(state.out, 0, 1) * level, runtime, nodeId, null, "linear envelope output");
}

function nodeGraphVactrolEnvelopeCoefficient(seconds, sampleRate) {
  const time = Number(seconds);
  if (!Number.isFinite(time) || time <= 0) {
    return 1;
  }
  const samples = Math.max(1, time * Math.max(1, sampleRate || nodeGraphMvp.sampleRate || 44100));
  return 1 - Math.exp(-1 / samples);
}

function nodeGraphVactrolEnvelopeSample(state, light, params, sampleRate, runtime = null, nodeId = "") {
  const safeLight = nodeGraphSafeFilterNumber(light, runtime, nodeId, null, "vactrol light");
  const attack = Math.max(0, nodeGraphSafeFilterNumber(params.attack, runtime, nodeId, null, "vactrol attack"));
  const release = Math.max(0, nodeGraphSafeFilterNumber(params.release, runtime, nodeId, null, "vactrol release"));
  const curve = Math.max(0.001, nodeGraphSafeFilterNumber(params.curve, runtime, nodeId, null, "vactrol curve"));
  const sensitivity = Math.max(0, nodeGraphSafeFilterNumber(params.sensitivity, runtime, nodeId, null, "vactrol sensitivity"));
  const lightOffset = clampNodeSliderValue(
    nodeGraphSafeFilterNumber(params.lightOffset, runtime, nodeId, null, "vactrol light offset"),
    0,
    1,
  );
  const darkCurrent = clampNodeSliderValue(
    nodeGraphSafeFilterNumber(params.darkCurrent, runtime, nodeId, null, "vactrol dark current"),
    0,
    1,
  );
  const rate = Math.max(1, sampleRate || nodeGraphMvp.sampleRate || 44100);
  const target = clampNodeSliderValue(safeLight * sensitivity + lightOffset, 0, 1);
  const coefficient = target > state.raw
    ? nodeGraphVactrolEnvelopeCoefficient(attack, rate)
    : nodeGraphVactrolEnvelopeCoefficient(release, rate);
  state.raw += (target - state.raw) * coefficient;
  const shaped = Math.pow(clampNodeSliderValue(state.raw, 0, 1), curve);
  state.out = clampNodeSliderValue(darkCurrent + shaped * (1 - darkCurrent), 0, 1);
  return nodeGraphSafeFilterNumber(state.out, runtime, nodeId, null, "vactrol output");
}

function nodeGraphFlowerChildSecondsToSamples(seconds, sampleRate) {
  const value = Number(seconds);
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }
  return Math.max(1, value * Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100));
}

function nodeGraphFlowerChildEnvelopeFollowerSample(state, input, params, sampleRate, runtime = null, nodeId = "") {
  const target = clampNodeSliderValue(
    Math.abs(nodeGraphSafeFilterNumber(input, runtime, nodeId, state, "flowerchild envelope input")),
    0,
    1,
  );
  const attackSamples = nodeGraphFlowerChildSecondsToSamples(
    nodeGraphSafeFilterNumber(params.attack, runtime, nodeId, state, "flowerchild envelope attack"),
    sampleRate,
  );
  const holdSamples = nodeGraphFlowerChildSecondsToSamples(
    nodeGraphSafeFilterNumber(params.hold, runtime, nodeId, state, "flowerchild envelope hold"),
    sampleRate,
  );
  const decaySamples = nodeGraphFlowerChildSecondsToSamples(
    nodeGraphSafeFilterNumber(params.decay, runtime, nodeId, state, "flowerchild envelope decay"),
    sampleRate,
  );
  const attackStep = 1 / attackSamples;
  const decayStep = 1 / decaySamples;
  const current = clampNodeSliderValue(Number(state.currentSlewedValue) || 0, 0, 1);
  if (target >= current) {
    state.currentSlewedValue = Math.min(target, current + attackStep);
    state.holdCounter = holdSamples;
  } else if ((Number(state.holdCounter) || 0) > 0) {
    state.holdCounter = Math.max(0, (Number(state.holdCounter) || 0) - 1);
    state.currentSlewedValue = current;
  } else {
    state.currentSlewedValue = Math.max(target, current - decayStep);
  }
  state.out = nodeGraphSafeFilterNumber(
    clampNodeSliderValue(state.currentSlewedValue, 0, 1),
    runtime,
    nodeId,
    state,
    "flowerchild envelope output",
  );
  return state.out;
}

function nodeGraphSampleChannelAt(sample, channelIndex, frameIndex) {
  const channel = sample?.channelData?.[channelIndex] || sample?.samples;
  if (!channel?.length) {
    return 0;
  }
  const maxIndex = channel.length - 1;
  const index = clampNodeSliderValue(Number(frameIndex) || 0, 0, maxIndex);
  const low = Math.floor(index);
  const high = Math.min(maxIndex, low + 1);
  const frac = index - low;
  return (Number(channel[low]) || 0) + ((Number(channel[high]) || 0) - (Number(channel[low]) || 0)) * frac;
}

function nodeGraphSampleStereoAt(sample, frameIndex) {
  const left = nodeGraphSampleChannelAt(sample, 0, frameIndex);
  const right = sample?.channelData?.length > 1
    ? nodeGraphSampleChannelAt(sample, 1, frameIndex)
    : left;
  return {
    Left: left,
    Mono: (left + right) * 0.5,
    Out: (left + right) * 0.5,
    Right: right,
  };
}

function nodeGraphAudioPlayerSample(runtime, node, nodeId, readInput, readParam, sampleRate) {
  const state = runtime.samplePlaybackStates.get(nodeId) || createNodeGraphSamplePlaybackState();
  runtime.samplePlaybackStates.set(nodeId, state);
  const sampleId = normalizeNodeGraphSampleId(node.sample?.id);
  const sample = runtime.samples?.get?.(sampleId);
  const frames = Math.max(0, Number(sample?.frames) || sample?.samples?.length || sample?.channelData?.[0]?.length || 0);
  if (!sample || frames <= 1) {
    return { Left: 0, Mono: 0, Out: 0, Phase: 0, Right: 0 };
  }
  const start = clampNodeSliderValue(readParam("start", 0), 0, 1);
  const end = clampNodeSliderValue(readParam("end", 1), 0, 1);
  const collapsedRange = Math.abs(end - start) <= 0.000001;
  const startPhase = collapsedRange ? 0 : Math.min(start, end);
  const endPhase = collapsedRange ? 1 : Math.max(start, end);
  const span = Math.max(0.000001, endPhase - startPhase);
  const rangeKey = `${startPhase}:${endPhase}`;
  if (state.sampleId !== sampleId) {
    state.phase = startPhase;
    state.completed = false;
    state.sampleId = sampleId;
  } else if (state.rangeKey !== rangeKey) {
    const currentPhase = Number(state.phase);
    if (!Number.isFinite(currentPhase) || currentPhase < startPhase || currentPhase > endPhase) {
      state.phase = startPhase;
    }
    state.completed = false;
  }
  if (state.rangeKey !== rangeKey) {
    state.rangeKey = rangeKey;
  }
  const transportFallback = Object.hasOwn(node?.params || {}, "transport")
    ? 4
    : ((Number(node?.params?.loop) || 0) >= 0.5 ? 4 : 0);
  const transportMode = Math.max(0, Math.min(4, Math.round(readParam("transport", transportFallback))));
  const transportReset = transportMode <= 0;
  const transportStopped = transportMode === 1;
  const transportPlayOnce = transportMode === 3;
  const transportLooping = transportMode >= 4;
  if (state.transportMode !== transportMode) {
    state.completed = false;
    state.transportMode = transportMode;
  }
  const reset = readInput("Reset");
  const resetEdge = state.lastReset <= 0 && reset > 0;
  if (resetEdge || transportReset || transportStopped) {
    state.phase = startPhase;
    state.completed = false;
  }
  state.playing = (transportPlayOnce || transportLooping) && !state.completed;
  state.lastReset = reset;

  const phaseConnected = runtime.inputConnections?.has?.(nodeGraphInputKey(nodeId, "Phase"));
  const speedInput = readInput("Speed");
  const speed = readParam("speed", 1) + speedInput;
  const sampleRateRatio = (Number(sample.sampleRate) || sampleRate || 44100) / Math.max(1, sampleRate || 44100);
  const increment = (speed * sampleRateRatio) / frames;
  const phase = phaseConnected
    ? clampNodeSliderValue(readInput("Phase"), 0, 1)
    : clampNodeSliderValue(state.phase, 0, 1);
  const boundedPhase = phase < startPhase || phase > endPhase
    ? startPhase
    : phase;
  const frameIndex = boundedPhase * (frames - 1);
  const stereo = nodeGraphSampleStereoAt(sample, frameIndex);
  const level = readParam("level", 1);
  let done = 0;
  if (!phaseConnected && state.playing) {
    const nextPhase = boundedPhase + increment;
    if (transportLooping) {
      const normalizedNext = (nextPhase - startPhase) / span;
      done = normalizedNext < 0 || normalizedNext >= 1 ? 1 : 0;
      state.phase = startPhase + wrapNodeSliderValue((nextPhase - startPhase) / span, 0, 1) * span;
    } else if (speed >= 0 && nextPhase >= endPhase) {
      state.phase = endPhase;
      state.completed = true;
      state.playing = false;
      done = 1;
    } else if (speed < 0 && nextPhase <= startPhase) {
      state.phase = startPhase;
      state.completed = true;
      state.playing = false;
      done = 1;
    } else {
      state.phase = clampNodeSliderValue(nextPhase, startPhase, endPhase);
    }
  } else if (!phaseConnected && (transportReset || transportStopped)) {
    state.phase = startPhase;
  } else {
    state.phase = boundedPhase;
  }
  const outputActive = state.playing;
  return {
    Left: outputActive ? stereo.Left * level : 0,
    Mono: outputActive ? stereo.Mono * level : 0,
    Out: outputActive ? stereo.Mono * level : 0,
    Phase: boundedPhase,
    Right: outputActive ? stereo.Right * level : 0,
    Trigger: done,
  };
}

function evaluateNodeGraphPlanFrame(runtime, sampleRate, frame, frames) {
  const frameValues = new Map();
  const mixInput = (nodeId, port = "In") => (runtime.inputConnections.get(`${nodeId}.${port}`) || []).reduce(
    (sum, connection) => sum + readNodeGraphRuntimePortOutput(
      runtime,
      frameValues,
      connection.sourceNode,
      connection.sourcePort,
      frame,
      frames,
    ),
    0,
  );
  const hasInput = (nodeId, port) => runtime.inputConnections.has(`${nodeId}.${port}`);

  const graphSampleX = (node, nodeId) => {
    const mode = Math.round(readNodeGraphLiveEffectiveParam(runtime, node, "mode", 0, frame, frames, frameValues));
    if (mode <= 0) {
      return mixInput(nodeId);
    }
    const safeRate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
    const absoluteFrame = Number.isFinite(runtime.absoluteFrame) ? runtime.absoluteFrame : frame;
    const rate = Math.max(0, readNodeGraphLiveEffectiveParam(runtime, node, "rate", 1, frame, frames, frameValues));
    const phase = readNodeGraphLiveEffectiveParam(runtime, node, "phase", 0, frame, frames, frameValues);
    const state = runtime.graphLfoStates.get(nodeId) || createNodeGraphGraphLfoState();
    runtime.graphLfoStates.set(nodeId, state);
    const resetValue = 0;
    if (state.lastReset <= 0 && resetValue > 0) {
      state.resetFrame = absoluteFrame;
    }
    state.lastReset = resetValue;
    const resetFrame = Number.isFinite(state.resetFrame) ? state.resetFrame : 0;
    return wrapNodeSliderValue(((absoluteFrame - resetFrame) / safeRate) * rate + phase, 0, 1);
  };
  const graphOutputValue = (node, nodeId) => {
    const normalizedValue = nodeGraphGraphValueAt(
      nodeGraphGraphForNode(node),
      graphSampleX(node, nodeId),
      nodeGraphGraphSmoothingModeForNode(node),
    );
    const outputMin = readNodeGraphLiveEffectiveParam(runtime, node, "outputMin", 0, frame, frames, frameValues);
    const outputMax = readNodeGraphLiveEffectiveParam(runtime, node, "outputMax", 1, frame, frames, frameValues);
    return outputMin + normalizedValue * (outputMax - outputMin);
  };
  const graphInputValue = (nodeId, graphInput, x, fallback) => {
    const connection = (runtime.graphInputConnections?.get(nodeGraphGraphInputKey(nodeId, graphInput)) || [])[0];
    const source = connection ? runtime.nodes.get(connection.sourceNode) : null;
    if (!source || !nodeGraphModuleIsGraphType(source.type)) {
      return fallback;
    }
    return nodeGraphGraphValueAt(
      nodeGraphGraphForNode(source),
      clampNodeSliderValue(Number(x) || 0, 0, 1),
      nodeGraphGraphSmoothingModeForNode(source),
    );
  };

  for (const nodeId of runtime.order || []) {
    const node = runtime.nodes.get(nodeId);
    let value = 0;

    if (node?.type === "groupInput") {
      value = {
        Out: Number(runtime.externalGroupInputs?.get(nodeId)) || 0,
      };
    } else if (node?.type === "audioInput") {
      const input = runtime.externalInput || {};
      const leftChannel = input.left || input.right || null;
      const rightChannel = input.right || input.left || null;
      const left = Number(leftChannel?.[frame]) || 0;
      const right = Number(rightChannel?.[frame]) || left;
      const level = readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        "level",
        1,
        frame,
        frames,
        frameValues,
      );
      value = {
        Left: left * level,
        Out: ((left + right) * 0.5) * level,
        Right: right * level,
      };
    } else if (node?.type === "audioPlayer") {
      const readParam = (key, fallback) => readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        key,
        fallback,
        frame,
        frames,
        frameValues,
      );
      value = nodeGraphAudioPlayerSample(
        runtime,
        node,
        nodeId,
        (port) => mixInput(nodeId, port),
        readParam,
        sampleRate,
      );
    } else if (node?.type === "sineWavetable") {
      const phase = runtime.phases.get(nodeId) || 0;
      const phaseOffset = nodeGraphPhaseRadians(
        readNodeGraphLiveEffectiveParam(
          runtime,
          node,
          "phase",
          0,
          frame,
          frames,
          frameValues,
        ),
      );
      const baseFrequency = readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        "freq",
        440,
        frame,
        frames,
        frameValues,
      );
      const freqInput = nodeGraphSafeFilterNumber(
        mixInput(nodeId, "Freq"),
        runtime,
        nodeId,
        null,
        "sin/cos freq input",
      );
      const ampInput = nodeGraphSafeFilterNumber(
        mixInput(nodeId, "Amplitude"),
        runtime,
        nodeId,
        null,
        "sin/cos amplitude input",
      );
      const pitchInput = clampNodeSliderValue(nodeGraphSafeFilterNumber(
        mixInput(nodeId, "0.1V/Oct"),
        runtime,
        nodeId,
        null,
        "sin/cos 0.1v input",
      ), -1, 1);
      const pitchedFrequency = Math.max(0, (baseFrequency + freqInput) * (2 ** (pitchInput / 0.1)));
      const amplitude = Math.max(0, readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        "amp",
        1,
        frame,
        frames,
        frameValues,
      ) + ampInput);
      const phaseIncrement = pitchedFrequency / sampleRate;
      value = nodeGraphSineCosWavetableSample(phase + phaseOffset, pitchedFrequency, amplitude, sampleRate);
      runtime.phases.set(
        nodeId,
        wrapNodeSliderValue(phase + Math.PI * 2 * phaseIncrement, 0, Math.PI * 2),
      );
    } else if (nodeGraphIsPolyBlepOscillatorType(node?.type)) {
      const resetState = runtime.oscResetStates.get(nodeId) || createNodeGraphOscResetState();
      runtime.oscResetStates.set(nodeId, resetState);
      const resetValue = nodeGraphSafeFilterNumber(
        mixInput(nodeId, "Reset"),
        runtime,
        nodeId,
        resetState,
        "osc reset",
      );
      const resetEdge = resetState.lastReset <= 0 && resetValue > 0;
      resetState.lastReset = resetValue;
      const phase = resetEdge ? 0 : runtime.phases.get(nodeId) || 0;
      if (resetEdge) {
        runtime.triangleStates.set(nodeId, 0);
      }
      const phaseOffset = nodeGraphPhaseRadians(
        readNodeGraphLiveEffectiveParam(
          runtime,
          node,
          "phase",
          0,
          frame,
          frames,
          frameValues,
        ),
      );
      const frequency = readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        "frequency",
        220,
        frame,
        frames,
        frameValues,
      );
      const waveform = readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        "waveform",
        0,
        frame,
        frames,
        frameValues,
      );
      const incrementInput = nodeGraphSafeFilterNumber(
        mixInput(nodeId, "Increment"),
        runtime,
        nodeId,
        null,
        "osc increment input",
      );
      const pitchInput = clampNodeSliderValue(nodeGraphSafeFilterNumber(
        mixInput(nodeId, "0.1V/Oct"),
        runtime,
        nodeId,
        null,
        "osc 0.1v/oct input",
      ), -1, 1);
      const pitchedFrequency = Math.max(0, frequency * (2 ** (pitchInput / 0.1)));
      const phaseIncrement = (pitchedFrequency / sampleRate) + incrementInput;
      const level = readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        "level",
        1,
        frame,
        frames,
        frameValues,
      );
      const sampleOscillator = node?.type === "fbPolyBlepOsc"
        ? nodeGraphForwardBackwardPolyBlepWaveformSample
        : nodeGraphOscillatorWaveformSample;
      const selected = sampleOscillator(
        runtime,
        nodeId,
        phase + phaseOffset,
        phaseIncrement,
        waveform,
      ) * level;
      value = {
        Out: selected,
        Saw: sampleOscillator(runtime, `${nodeId}:saw`, phase + phaseOffset, phaseIncrement, 0) * level,
        Ramp: sampleOscillator(runtime, `${nodeId}:ramp`, phase + phaseOffset, phaseIncrement, 1) * level,
        Square: sampleOscillator(runtime, `${nodeId}:square`, phase + phaseOffset, phaseIncrement, 2) * level,
        Tri: sampleOscillator(runtime, `${nodeId}:tri`, phase + phaseOffset, phaseIncrement, 3) * level,
        Sine: sampleOscillator(runtime, `${nodeId}:sine`, phase + phaseOffset, phaseIncrement, 4) * level,
        "Wave Out": selected,
        Noise: selected,
      };
      runtime.phases.set(
        nodeId,
        wrapNodeSliderValue(phase + Math.PI * 2 * phaseIncrement, 0, Math.PI * 2),
      );
    } else if (node?.type === "additiveOsc" || node?.type === "gpuAdditiveOsc") {
      const resetState = runtime.oscResetStates.get(nodeId) || createNodeGraphOscResetState();
      runtime.oscResetStates.set(nodeId, resetState);
      const resetValue = nodeGraphSafeFilterNumber(
        mixInput(nodeId, "Reset"),
        runtime,
        nodeId,
        resetState,
        "additive osc reset",
      );
      const resetEdge = resetState.lastReset <= 0 && resetValue > 0;
      resetState.lastReset = resetValue;
      const phase = resetEdge ? 0 : runtime.phases.get(nodeId) || 0;
      const phaseOffset = nodeGraphPhaseRadians(readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        "phase",
        0,
        frame,
        frames,
        frameValues,
      ));
      const frequency = readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        "frequency",
        220,
        frame,
        frames,
        frameValues,
      );
      const pitchInput = clampNodeSliderValue(nodeGraphSafeFilterNumber(
        mixInput(nodeId, "0.1V/Oct"),
        runtime,
        nodeId,
        null,
        "additive osc 0.1v/oct input",
      ), -1, 1);
      const pitchedFrequency = Math.max(0, frequency * (2 ** (pitchInput / 0.1)));
      const incrementInput = nodeGraphSafeFilterNumber(
        mixInput(nodeId, "Increment"),
        runtime,
        nodeId,
        null,
        "additive osc increment input",
      );
      const phaseIncrement = (pitchedFrequency / sampleRate) + incrementInput;
      const additiveSample = nodeGraphAdditiveOscillatorSample(
        runtime,
        nodeId,
        phase + phaseOffset,
        {
          frequency: pitchedFrequency,
          dampingFilterFrequency: readNodeGraphLiveEffectiveParam(runtime, node, "dampingFilterFrequency", 20000, frame, frames, frameValues),
          dampingGraphValueAt: (x) => graphInputValue(nodeId, "Damping Graph", x, 1),
          harmonics: readNodeGraphLiveEffectiveParam(runtime, node, "harmonics", 32, frame, frames, frameValues),
          harmonicPhaseAdd: readNodeGraphLiveEffectiveParam(runtime, node, "harmonicPhaseAdd", 0, frame, frames, frameValues),
          harmonicPhaseMultiply: readNodeGraphLiveEffectiveParam(runtime, node, "harmonicPhaseMultiply", 0, frame, frames, frameValues),
          level: readNodeGraphLiveEffectiveParam(runtime, node, "level", 0.35, frame, frames, frameValues),
          modA: readNodeGraphLiveEffectiveParam(runtime, node, "modA", 0.5, frame, frames, frameValues),
          phaseGraphValueAt: (x) => graphInputValue(nodeId, "Phase Graph", x, 0),
          waveform: readNodeGraphLiveEffectiveParam(runtime, node, "waveform", 1, frame, frames, frameValues),
        },
        sampleRate,
      );
      value = { Out: additiveSample };
      runtime.phases.set(
        nodeId,
        wrapNodeSliderValue(phase + Math.PI * 2 * phaseIncrement, 0, Math.PI * 2),
      );
    } else if (node?.type === "ellipsoid") {
      const resetState = runtime.oscResetStates.get(nodeId) || createNodeGraphOscResetState();
      runtime.oscResetStates.set(nodeId, resetState);
      const resetValue = nodeGraphSafeFilterNumber(
        mixInput(nodeId, "Reset"),
        runtime,
        nodeId,
        resetState,
        "ellipsoid reset",
      );
      const resetEdge = resetState.lastReset <= 0 && resetValue > 0;
      resetState.lastReset = resetValue;
      const phase = resetEdge ? 0 : runtime.phases.get(nodeId) || 0;
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        key,
        fallback,
        frame,
        frames,
        frameValues,
      );
      const phaseOffset = nodeGraphPhaseRadians(read("phase", 0));
      const frequency = read("frequency", 220);
      const pitchInput = clampNodeSliderValue(nodeGraphSafeFilterNumber(
        mixInput(nodeId, "0.1V/Oct"),
        runtime,
        nodeId,
        null,
        "ellipsoid 0.1v/oct input",
      ), -1, 1);
      const pitchedFrequency = Math.max(0, frequency * (2 ** (pitchInput / 0.1)));
      const incrementInput = nodeGraphSafeFilterNumber(
        mixInput(nodeId, "Increment"),
        runtime,
        nodeId,
        null,
        "ellipsoid increment input",
      );
      const phaseIncrement = (pitchedFrequency / sampleRate) + incrementInput;
      value = nodeGraphEllipsoidVectorSample(phase + phaseOffset, {
        level: read("level", 1),
        offsetX: read("offsetX", 0),
        offsetY: read("offsetY", 0),
        scaleX: read("scaleX", 1),
        scaleY: read("scaleY", 1),
        shapeX: read("shapeX", 0),
        shapeY: read("shapeY", 0),
      });
      runtime.phases.set(
        nodeId,
        wrapNodeSliderValue(phase + Math.PI * 2 * phaseIncrement, 0, Math.PI * 2),
      );
    } else if (node?.type === "noiseGenerator") {
      const state = runtime.noiseGeneratorStates.get(nodeId) || createNodeGraphNoiseGeneratorState();
      runtime.noiseGeneratorStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphNoiseGeneratorSample(
        state,
        {
          deviation: read("deviation", 0.5),
          level: read("level", 1),
          mean: read("mean", 0),
          mode: read("mode", 0),
          seed: read("seed", 1),
        },
        runtime,
        nodeId,
      );
    } else if (node?.type === "randomWalk") {
      const state = runtime.randomWalkStates.get(nodeId) || createNodeGraphRandomWalkState();
      runtime.randomWalkStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphRandomWalkSample(
        state,
        {
          frequency: read("frequency", 2),
          jitter: read("jitter", 0.25),
          level: read("level", 1),
          method: read("method", 3),
          seed: read("seed", 1),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "fractalBrownianNoise") {
      const state = runtime.fractalBrownianNoiseStates.get(nodeId) || createNodeGraphFractalBrownianNoiseState();
      runtime.fractalBrownianNoiseStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphFractalBrownianNoiseVector(
        state,
        {
          frequency: read("frequency", 0.5),
          level: read("level", 1),
          octaves: read("octaves", 4),
          persistence: read("persistence", 0.5),
          scale: read("scale", 1),
          seed: read("seed", 1),
        },
        sampleRate,
        runtime,
        nodeId,
        mixInput(nodeId, "Reset"),
      );
    } else if (node?.type === "clock") {
      const state = runtime.clockStates.get(nodeId) || createNodeGraphClockState();
      runtime.clockStates.set(nodeId, state);
      value = nodeGraphClockSample(
        state,
        mixInput(nodeId, "Reset"),
        readNodeGraphLiveEffectiveParam(runtime, node, "phase", 0, frame, frames, frameValues),
        readNodeGraphLiveEffectiveParam(runtime, node, "rate", 2, frame, frames, frameValues),
        readNodeGraphLiveEffectiveParam(runtime, node, "duty", 0.5, frame, frames, frameValues),
        readNodeGraphLiveEffectiveParam(runtime, node, "level", 1, frame, frames, frameValues),
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "transport") {
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphTransportSample(
        {
          amplitude: read("amplitude", 1),
          divisions: read("divisions", 0),
        },
        Number.isFinite(runtime.absoluteFrame) ? runtime.absoluteFrame : frame,
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "randomClock") {
      const state = runtime.randomClockStates.get(nodeId) || createNodeGraphRandomClockState();
      runtime.randomClockStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphRandomClockSample(
        state,
        mixInput(nodeId, "Reset"),
        {
          duty: read("duty", 0.5),
          level: read("level", 1),
          maxSeconds: read("maxSeconds", 1),
          minSeconds: read("minSeconds", 0.25),
          seed: read("seed", 1),
          threshold: read("threshold", 0),
          triggerTime: read("triggerTime", 0.01),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "clockDivider") {
      const state = runtime.clockDividerStates.get(nodeId) || createNodeGraphTriggerDividerState();
      runtime.clockDividerStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const division = Math.max(1, Math.min(64, Math.round(read("division", 2))));
      const sourceRate = nodeGraphOfflineIncomingClockRate(nodeId);
      const pulseTime = sourceRate > 0
        ? clampNodeSliderValue(read("duty", 0.5), 0.01, 1) * division / sourceRate
        : 0.01;
      value = nodeGraphTriggerDividerSample(
        state,
        mixInput(nodeId, "Clock"),
        mixInput(nodeId, "Reset"),
        {
          division,
          level: read("level", 1),
          pulseTime,
          threshold: read("threshold", 0),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "delayedTrigger") {
      const state = runtime.delayedTriggerStates.get(nodeId) || createNodeGraphDelayedTriggerState();
      runtime.delayedTriggerStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphDelayedTriggerSample(
        state,
        mixInput(nodeId, "Trigger"),
        mixInput(nodeId, "Reset"),
        {
          delay: read("delay", 0.1),
          level: read("level", 1),
          pulseTime: read("pulseTime", 0.01),
          threshold: read("threshold", 0),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "triggerCounter") {
      const state = runtime.triggerCounterStates.get(nodeId) || createNodeGraphTriggerCounterState();
      runtime.triggerCounterStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphTriggerCounterSample(
        state,
        mixInput(nodeId, "Trigger"),
        mixInput(nodeId, "Reset"),
        {
          countMax: read("countMax", 8),
          increment: read("increment", 1),
          level: read("level", 1),
          pulseTime: read("pulseTime", 0.01),
          threshold: read("threshold", 0),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "triggerDivider") {
      const state = runtime.triggerDividerStates.get(nodeId) || createNodeGraphTriggerDividerState();
      runtime.triggerDividerStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphTriggerDividerSample(
        state,
        mixInput(nodeId, "Trigger"),
        mixInput(nodeId, "Reset"),
        {
          division: read("division", 2),
          level: read("level", 1),
          pulseTime: read("pulseTime", 0.01),
          threshold: read("threshold", 0),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "stepSequencer") {
      const state = runtime.stepSequencerStates.get(nodeId) || createNodeGraphStepSequencerState();
      runtime.stepSequencerStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphStepSequencerSample(
        state,
        mixInput(nodeId, "Trigger"),
        mixInput(nodeId, "Reset"),
        {
          level: read("level", 1),
          steps: read("steps", 8),
          threshold: read("threshold", 0),
          values: [
            read("step1", 0),
            read("step2", 0.25),
            read("step3", 0.5),
            read("step4", 0.75),
            read("step5", 1),
            read("step6", 0.75),
            read("step7", 0.5),
            read("step8", 0.25),
          ],
        },
        runtime,
        nodeId,
      );
    } else if (node?.type === "spiral") {
      const state = runtime.spiralStates.get(nodeId) || createJerobeamSpiralState();
      runtime.spiralStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        key,
        fallback,
        frame,
        frames,
        frameValues,
      );
      const spiral = jerobeamSpiralSample({
        density: read("density", 1),
        frequency: read("frequency", 440),
        morph: read("morph", 0),
        morphSpeed: read("morphSpeed", 0),
        position: read("position", 0),
        positionSpeed: read("positionSpeed", 0),
        rotX: read("rotX", 0),
        rotXSpeed: read("rotXSpeed", 0),
        rotY: read("rotY", 0),
        rotYSpeed: read("rotYSpeed", 0),
        sampleRate,
        sharp: read("sharp", 0.5),
        sharpCurve: read("sharpCurve", 0),
        sharpCurveMult: read("sharpCurveMult", 1),
        size: read("size", 0.5),
        state,
        zAmount: read("zAmount", 0),
        zDepth: read("zDepth", 0),
      });
      const level = read("level", 1);
      value = {
        X: spiral.x * level,
        Y: spiral.y * level,
        Z: spiral.z * level,
      };
    } else if (node?.type === "fractalSpiral") {
      const state = runtime.fractalSpiralStates.get(nodeId) || createFractalSpiralState();
      runtime.fractalSpiralStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        key,
        fallback,
        frame,
        frames,
        frameValues,
      );
      const fractal = fractalSpiralSample({
        frequency: read("frequency", 1),
        gain: read("gain", 0.5),
        growth: read("growth", 1.5),
        lacunarity: read("lacunarity", 2),
        octaves: read("octaves", 5),
        sampleRate,
        size: read("size", 0.5),
        spin: read("spin", 0.05),
        state,
        twist: read("twist", 0.381966),
      });
      const fractalLevel = read("level", 1);
      value = {
        X: fractal.x * fractalLevel,
        Y: fractal.y * fractalLevel,
        Z: fractal.z * fractalLevel,
      };
    } else if (node?.type === "logSpiral") {
      const state = runtime.logSpiralStates.get(nodeId) || createLogSpiralState();
      runtime.logSpiralStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        key,
        fallback,
        frame,
        frames,
        frameValues,
      );
      const logSpiral = logSpiralSample({
        frequency: read("frequency", 1),
        growth: read("growth", 3),
        sampleRate,
        size: read("size", 0.5),
        spin: read("spin", 0.05),
        state,
        turns: read("turns", 4),
      });
      const logSpiralLevel = read("level", 1);
      value = {
        X: logSpiral.x * logSpiralLevel,
        Y: logSpiral.y * logSpiralLevel,
        Z: logSpiral.z * logSpiralLevel,
      };
    } else if (node?.type === "lorenzAttractor") {
      const state = runtime.lorenzAttractorStates.get(nodeId) || createNodeGraphLorenzAttractorState();
      runtime.lorenzAttractorStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        key,
        fallback,
        frame,
        frames,
        frameValues,
      );
      const lorenz = nodeGraphLorenzAttractorSample({
        beta: read("beta", 8 / 3),
        reset: mixInput(nodeId, "Reset"),
        rho: read("rho", 28),
        rotate: read("rotate", 0),
        sampleRate,
        scale: read("scale", 1),
        sigma: read("sigma", 10),
        speed: read("speed", 1),
        state,
        zDepth: read("zDepth", 0.4),
      });
      const level = read("level", 1);
      value = {
        X: lorenz.x * level,
        Y: lorenz.y * level,
        Z: lorenz.z * level,
      };
    } else if (node?.type === "logisticMap") {
      const state = runtime.logisticMapStates.get(nodeId) || createNodeGraphLogisticMapState();
      runtime.logisticMapStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = {
        Out: nodeGraphLogisticMapSample({
          level: read("level", 1),
          r: read("r", 3.9),
          rate: read("rate", 8),
          reset: mixInput(nodeId, "Reset"),
          sampleRate,
          seed: read("seed", 0.5),
          state,
        }),
      };
    } else if (node?.type === "henonMap") {
      const state = runtime.henonMapStates.get(nodeId) || createNodeGraphHenonMapState();
      runtime.henonMapStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const henon = nodeGraphHenonMapSample({
        a: read("a", 1.4),
        b: read("b", 0.3),
        rate: read("rate", 8),
        reset: mixInput(nodeId, "Reset"),
        sampleRate,
        seedX: read("seedX", 0.1),
        seedY: read("seedY", 0.1),
        state,
      });
      const henonLevel = read("level", 1);
      value = {
        X: henon.x * henonLevel,
        Y: henon.y * henonLevel,
      };
    } else if (node?.type === "chuaAttractor") {
      const state = runtime.chuaAttractorStates.get(nodeId) || createNodeGraphChuaAttractorState();
      runtime.chuaAttractorStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const chua = nodeGraphChuaAttractorSample({
        alpha: read("alpha", 15.6),
        beta: read("beta", 28),
        m0: read("m0", -1.143),
        m1: read("m1", -0.714),
        reset: mixInput(nodeId, "Reset"),
        sampleRate,
        speed: read("speed", 1),
        state,
      });
      const chuaLevel = read("level", 1);
      value = {
        X: chua.x * chuaLevel,
        Y: chua.y * chuaLevel,
        Z: chua.z * chuaLevel,
      };
    } else if (node?.type === "wirdoSpiral") {
      const state = runtime.wirdoSpiralStates.get(nodeId) || createNodeGraphWirdoSpiralState();
      runtime.wirdoSpiralStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const wirdo = nodeGraphWirdoSpiralSample({
        cross: read("cross", 0),
        cut: read("cut", 1000),
        density: read("density", 0.8),
        frequency: read("frequency", 8),
        length: read("length", 1),
        reset: mixInput(nodeId, "Reset"),
        ringCut: read("ringCut", 10),
        rotate: read("rotate", 0),
        sampleRate,
        scrap: read("scrap", 1),
        sharp: read("sharp", 0),
        splashDensity: read("splashDensity", 0),
        splashDepth: read("splashDepth", 0),
        splashSpeed: read("splashSpeed", 0),
        state,
        syncCut: read("syncCut", 1),
      });
      const wirdoLevel = read("level", 1);
      value = {
        X: wirdo.x * wirdoLevel,
        Y: wirdo.y * wirdoLevel,
      };
    } else if (node?.type === "blubb") {
      const state = runtime.blubbStates.get(nodeId) || createNodeGraphBlubbState();
      runtime.blubbStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const blubb = nodeGraphBlubbSample({
        frequency: read("frequency", 8),
        reset: mixInput(nodeId, "Reset"),
        rotX: read("rotX", 0),
        rotY: read("rotY", 0),
        sampleRate,
        shape: read("shape", 0),
        state,
        zDepth: read("zDepth", 0),
      });
      const blubbLevel = read("level", 1);
      value = {
        X: blubb.x * blubbLevel,
        Y: blubb.y * blubbLevel,
      };
    } else if (node?.type === "mushroom") {
      const state = runtime.mushroomStates.get(nodeId) || createNodeGraphMushroomState();
      runtime.mushroomStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const mushroom = nodeGraphMushroomSample({
        apart: read("apart", 0),
        capRotation: read("capRotation", 0),
        capStemTransition: read("capStemTransition", 0.1),
        clusterRotation: read("clusterRotation", 0),
        clusterRotationSpeed: read("clusterRotationSpeed", 0),
        density: read("density", 3),
        frequency: read("frequency", 8),
        grow: read("grow", 1),
        head: read("head", 0.6667),
        numMushrooms: read("numMushrooms", 1),
        phaseOffset: read("phaseOffset", 0),
        reset: mixInput(nodeId, "Reset"),
        sampleRate,
        sharp: read("sharp", 0),
        spread: read("spread", 0.5),
        state,
        stem: read("stem", 0),
        stemRotationSpeed: read("stemRotationSpeed", 0),
        width: read("width", 1),
        wobble: read("wobble", 0.0625),
      });
      const mushroomLevel = read("level", 1);
      value = {
        X: mushroom.x * mushroomLevel,
        Y: mushroom.y * mushroomLevel,
      };
    } else if (node?.type === "boing") {
      const state = runtime.boingStates.get(nodeId) || createNodeGraphBoingState();
      runtime.boingStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const boing = nodeGraphBoingSample({
        boing: read("boing", 0),
        boingStrength: read("boingStrength", 0),
        density: read("density", 1),
        dir: read("dir", 0),
        ends: read("ends", 0),
        frequency: read("frequency", 8),
        reset: mixInput(nodeId, "Reset"),
        rotX: read("rotX", 0),
        rotY: read("rotY", 0),
        sampleRate,
        shape: read("shape", 0),
        sharpness: read("sharpness", 0),
        state,
        volume: read("volume", 1),
        volumePreJump: read("volumePreJump", 0),
        zAmount: read("zAmount", 0),
        zDepth: read("zDepth", 0),
      });
      const boingLevel = read("level", 1);
      value = {
        X: boing.x * boingLevel,
        Y: boing.y * boingLevel,
      };
    } else if (node?.type === "torus") {
      const state = runtime.torusStates.get(nodeId) || createNodeGraphTorusState();
      runtime.torusStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const torus = nodeGraphTorusSample({
        balance: read("balance", 0),
        darkAngle: read("darkAngle", 0),
        darkIntensity: read("darkIntensity", 0),
        density: read("density", 1),
        frequency: read("frequency", 8),
        length: read("length", 0),
        quantizeDensity: read("quantizeDensity", 1),
        quantizeSubDensity: read("quantizeSubDensity", 1),
        reset: mixInput(nodeId, "Reset"),
        rotX: read("rotX", 0),
        rotY: read("rotY", 0),
        rotZ: read("rotZ", 0),
        sampleRate,
        sharp: read("sharp", 0.5),
        size: read("size", 1),
        state,
        subdensity: read("subdensity", 0),
        wander: read("wander", 0),
        zAngleX: read("zAngleX", 0),
        zAngleY: read("zAngleY", 0),
        zDepth: read("zDepth", 0),
      });
      const torusLevel = read("level", 1);
      value = {
        X: torus.x * torusLevel,
        Y: torus.y * torusLevel,
      };
    } else if (node?.type === "keplerBouwkamp") {
      const state = runtime.keplerBouwkampStates.get(nodeId) || createNodeGraphKeplerBouwkampState();
      runtime.keplerBouwkampStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const kepler = nodeGraphKeplerBouwkampSample({
        circles: read("circles", 0.5),
        frequency: read("frequency", 8),
        length: read("length", 1),
        reset: mixInput(nodeId, "Reset"),
        rotation: read("rotation", 0),
        sampleRate,
        start: read("start", 3),
        state,
        tri: read("tri", 0),
        zoom: read("zoom", 0),
      });
      const keplerLevel = read("level", 1);
      value = {
        X: kepler.x * keplerLevel,
        Y: kepler.y * keplerLevel,
      };
    } else if (node?.type === "nyquistShannon") {
      const state = runtime.nyquistShannonStates.get(nodeId) || createNodeGraphNyquistShannonState();
      runtime.nyquistShannonStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const nyquist = nodeGraphNyquistShannonSample({
        artifact: read("artifact", 0),
        enableToneModFreq: read("enableToneModFreq", 0),
        enableToneModNote: read("enableToneModNote", 0),
        enableToneModPitch: read("enableToneModPitch", 1),
        frequencyA: read("frequencyA", 440),
        frequencyB: read("frequencyB", 5),
        midiNoteRaw: read("midiNoteRaw", 48),
        phaseOffset: read("phaseOffset", 0),
        rate: read("rate", 20),
        reset: mixInput(nodeId, "Reset"),
        sampleDots: read("sampleDots", 0),
        sampleRate,
        state,
        subPhase: read("subPhase", 0),
        subPhaseRotationSpeed: read("subPhaseRotationSpeed", 0),
        tone: read("tone", 0),
        toneSmoothTime: read("toneSmoothTime", 0.01),
      });
      const nyquistLevel = read("level", 1);
      value = {
        X: nyquist.x * nyquistLevel,
        Y: nyquist.y * nyquistLevel,
      };
    } else if (node?.type === "radar") {
      const state = runtime.radarStates.get(nodeId) || createNodeGraphRadarState();
      runtime.radarStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const radar = nodeGraphRadarSample({
        density: read("density", 1),
        direction: read("direction", 0),
        fade: read("fade", 1),
        frequency: read("frequency", 1),
        frontring: read("frontring", 0),
        inner: read("inner", 0),
        lap: read("lap", 0),
        length: read("length", 1),
        phaseInv: read("phaseInv", 0),
        phaseOffset: read("phaseOffset", 0),
        pow1Down: read("pow1Down", 0),
        pow1Up: read("pow1Up", 0),
        pow2Bend: read("pow2Bend", 0),
        ratio: read("ratio", 0),
        reset: mixInput(nodeId, "Reset"),
        ringcut: read("ringcut", 0),
        rotation: read("rotation", 0),
        sampleRate,
        shade: read("shade", 1),
        sharp: read("sharp", 0),
        spiralReturn: read("spiralReturn", 0),
        state,
        tunnelInv: read("tunnelInv", 0),
        x: read("x", 0),
        y: read("y", 0),
        zDepth: read("zDepth", 0),
        zoom: read("zoom", 0),
      });
      const radarLevel = read("level", 1);
      value = {
        X: radar.x * radarLevel,
        Y: radar.y * radarLevel,
      };
    } else if (node?.type === "chordMemory") {
      const state = runtime.chordMemoryStates.get(nodeId) || createNodeGraphChordMemoryState();
      runtime.chordMemoryStates.set(nodeId, state);
      value = nodeGraphChordMemorySample(state, {
        advance: mixInput(nodeId, "Advance"),
        clear: mixInput(nodeId, "Clear"),
        latch: mixInput(nodeId, "Latch"),
        pitch: mixInput(nodeId, "Pitch"),
      });
    } else if (node?.type === "turingMachine") {
      const state = runtime.turingMachineStates.get(nodeId) || createNodeGraphTuringMachineState();
      runtime.turingMachineStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const hasClockInput = hasInput(nodeId, "Clock");
      const clock = hasClockInput
        ? mixInput(nodeId, "Clock")
        : nodeGraphAdvanceTuringMachineSelfClock(state, read("frequency", 4), sampleRate);
      value = nodeGraphTuringMachineSample(state, {
        clock,
        length: read("length", 8),
        level: read("level", 1),
        probability: read("probability", 0.25),
        reset: mixInput(nodeId, "Reset"),
      });
    } else if (node?.type === "changeDetector") {
      const state = runtime.changeDetectorStates.get(nodeId) || createNodeGraphChangeDetectorState();
      runtime.changeDetectorStates.set(nodeId, state);
      const changeDetector = nodeGraphChangeDetectorSample(state, mixInput(nodeId), runtime, nodeId);
      value = {
        "+": changeDetector.up,
        "~": changeDetector.same,
        "-": changeDetector.down,
        "*": changeDetector.changed,
      };
    } else if (node?.type === "yellowjacketFilter") {
      const state = runtime.yellowjacketFilterStates.get(nodeId) || createNodeGraphYellowjacketFilterState();
      runtime.yellowjacketFilterStates.set(nodeId, state);
      value = nodeGraphYellowjacketFilterSample(
        state,
        mixInput(nodeId),
        {
          chaos: readNodeGraphLiveEffectiveParam(runtime, node, "chaos", 0, frame, frames, frameValues),
          frequency: readNodeGraphLiveEffectiveParam(runtime, node, "frequency", 0.5, frame, frames, frameValues),
          resonance: readNodeGraphLiveEffectiveParam(runtime, node, "resonance", 0.2, frame, frames, frameValues),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "superloveFilter") {
      const state = runtime.superloveFilterStates.get(nodeId) || createNodeGraphSuperloveFilterState();
      runtime.superloveFilterStates.set(nodeId, state);
      value = nodeGraphSuperloveFilterSample(
        state,
        mixInput(nodeId),
        {
          chaos: readNodeGraphLiveEffectiveParam(runtime, node, "chaos", 0.5, frame, frames, frameValues),
          frequency: readNodeGraphLiveEffectiveParam(runtime, node, "frequency", 0.5, frame, frames, frameValues),
          mode: readNodeGraphLiveEffectiveParam(runtime, node, "mode", 0, frame, frames, frameValues),
          resonance: readNodeGraphLiveEffectiveParam(runtime, node, "resonance", 0.2, frame, frames, frameValues),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "rsmetFilter") {
      const state = runtime.rsmetFilterStates.get(nodeId) || createNodeGraphRsmetFilterState();
      runtime.rsmetFilterStates.set(nodeId, state);
      value = nodeGraphRsmetFilterSample(
        state,
        mixInput(nodeId),
        {
          chaos: readNodeGraphLiveEffectiveParam(runtime, node, "chaos", 0, frame, frames, frameValues),
          frequency: readNodeGraphLiveEffectiveParam(runtime, node, "frequency", 0.5, frame, frames, frameValues),
          mode: readNodeGraphLiveEffectiveParam(runtime, node, "mode", 0, frame, frames, frameValues),
          resonance: readNodeGraphLiveEffectiveParam(runtime, node, "resonance", 0.2, frame, frames, frameValues),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "chaoticPhaseLockingFilter") {
      const state = runtime.chaoticPhaseLockingFilterStates.get(nodeId) || createNodeGraphChaoticPhaseLockingFilterState();
      runtime.chaoticPhaseLockingFilterStates.set(nodeId, state);
      value = nodeGraphChaoticPhaseLockingFilterSample(
        state,
        mixInput(nodeId),
        {
          chaos: readNodeGraphLiveEffectiveParam(runtime, node, "chaos", 1, frame, frames, frameValues),
          frequency: readNodeGraphLiveEffectiveParam(runtime, node, "frequency", 0.5, frame, frames, frameValues),
          resonance: readNodeGraphLiveEffectiveParam(runtime, node, "resonance", 0.2, frame, frames, frameValues),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "dsfOscillator") {
      const state = runtime.dsfOscillatorStates.get(nodeId) || createNodeGraphDsfOscillatorState();
      runtime.dsfOscillatorStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphDsfOscillatorSample(state, {
        frequencyHz: Math.max(0, read("frequency", 100)),
        sampleRate,
        waveform: read("waveform", 1),
        morph: read("morph", 1),
        pulseWidth: read("pulseWidth", 0.5),
        blend: read("blend", 0.5),
        level: read("level", 1),
      });
    } else if (node?.type === "robinSupersaw") {
      const state = runtime.robinSupersawStates.get(nodeId) || createNodeGraphRobinSupersawState();
      runtime.robinSupersawStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const baseFrequency = Math.max(0, read("frequency", 100));
      const pitchInput = clampNodeSliderValue(nodeGraphSafeFilterNumber(
        mixInput(nodeId, "0.1V/Oct"),
        runtime,
        nodeId,
        null,
        "RobinSupersaw 0.1v input",
      ), -1, 1);
      const pitchReferenceAudio = normalizeNodeGraphPatchAudio(nodeGraphMvp.patch.audio);
      const referenceMidiNote = Number.isFinite(pitchReferenceAudio.pitchReferenceMidiNote) ? pitchReferenceAudio.pitchReferenceMidiNote : 48;
      const referenceVoltage = referenceMidiNote / 120;
      const pitchedFrequency = Math.max(0, baseFrequency * (2 ** ((pitchInput - referenceVoltage) / 0.1)));
      value = nodeGraphRobinSupersawSample(state, {
        frequencyHz: pitchedFrequency,
        sampleRate,
        detuneCents: read("detuneCents", 30),
        voices: read("voices", 7),
        level: read("level", 1),
      });
    } else if (node?.type === "flowerChildFilter") {
      const state = runtime.flowerChildFilterStates.get(nodeId) || createNodeGraphFlowerChildFilterState();
      runtime.flowerChildFilterStates.set(nodeId, state);
      value = nodeGraphFlowerChildFilterSample(
        state,
        mixInput(nodeId),
        {
          frequency: readNodeGraphLiveEffectiveParam(runtime, node, "frequency", 0.5, frame, frames, frameValues),
          mode: readNodeGraphLiveEffectiveParam(runtime, node, "mode", 0, frame, frames, frameValues),
          resonance: readNodeGraphLiveEffectiveParam(runtime, node, "resonance", 0.2, frame, frames, frameValues),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "resonatorFilter") {
      const state = runtime.resonatorFilterStates.get(nodeId) || createNodeGraphResonatorFilterState();
      runtime.resonatorFilterStates.set(nodeId, state);
      value = nodeGraphResonatorFilterSample(
        state,
        mixInput(nodeId),
        {
          chaos: readNodeGraphLiveEffectiveParam(runtime, node, "chaos", 0, frame, frames, frameValues),
          frequency: readNodeGraphLiveEffectiveParam(runtime, node, "frequency", 0.5, frame, frames, frameValues),
          mode: readNodeGraphLiveEffectiveParam(runtime, node, "mode", 0, frame, frames, frameValues),
          resonance: readNodeGraphLiveEffectiveParam(runtime, node, "resonance", 0.2, frame, frames, frameValues),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "humanFilter") {
      const state = runtime.humanFilterStates.get(nodeId) || createNodeGraphHumanFilterState();
      runtime.humanFilterStates.set(nodeId, state);
      value = nodeGraphHumanFilterSample(
        state,
        mixInput(nodeId),
        {
          chaos: readNodeGraphLiveEffectiveParam(runtime, node, "chaos", 0, frame, frames, frameValues),
          frequency: readNodeGraphLiveEffectiveParam(runtime, node, "frequency", 0.5, frame, frames, frameValues),
          mode: readNodeGraphLiveEffectiveParam(runtime, node, "mode", 0, frame, frames, frameValues),
          resonance: readNodeGraphLiveEffectiveParam(runtime, node, "resonance", 0.2, frame, frames, frameValues),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "pitchQuantizer") {
      const state = runtime.pitchQuantizerStates.get(nodeId) || createNodeGraphPitchQuantizerState();
      runtime.pitchQuantizerStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = {
        "0.1V/Oct": nodeGraphPitchQuantizerSample(state, {
          hasScaleInput: hasInput(nodeId, "Scale"),
          pitch: mixInput(nodeId, "0.1V/Oct"),
          scaleChoice: read("scale", 1),
          scaleInput: mixInput(nodeId, "Scale"),
        }),
      };
    } else if (node?.type === "surgeOscillator") {
      const state = runtime.surgeOscillatorStates.get(nodeId) || createNodeGraphSurgeOscillatorState();
      runtime.surgeOscillatorStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const baseFrequency = Math.max(0, read("frequency", 220));
      const pitchInput = clampNodeSliderValue(nodeGraphSafeFilterNumber(
        mixInput(nodeId, "0.1V/Oct"),
        runtime,
        nodeId,
        0,
        "hard sync oscillator 0.1v input",
      ), -10, 10);
      const frequencyHz = Math.max(0, baseFrequency * (2 ** (pitchInput / 0.1)));
      value = nodeGraphSurgeOscillatorSample(state, {
        frequencyHz,
        sampleRate,
        syncIn: mixInput(nodeId, "Sync"),
        hasExternalSync: hasInput(nodeId, "Sync"),
        syncFrequencyHz: read("syncFrequency", 50),
        waveform: read("waveform", 0),
        level: read("level", 1),
      });
    } else if (node?.type === "midiOut") {
      const midiInputKey = `${nodeId}.MIDI Number`;
      const hasMidiInput = runtime.inputConnections.has(midiInputKey);
      const midiNumber = Math.max(0, Math.min(127, Math.round(readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        "midiNumber",
        60,
        frame,
        frames,
        frameValues,
      ))));
      const outputMidiNumber = hasMidiInput
        ? Math.max(0, Math.min(127, Math.round(Number(mixInput(nodeId, "MIDI Number")) || 0)))
        : midiNumber;
      value = {
        "Full Value": outputMidiNumber,
        Normalized: outputMidiNumber / 127,
      };
    } else if (node?.type === "midiNotePitch") {
      const pitch = Math.max(0, Math.min(127, (
        Number(mixInput(nodeId, "MIDI Note")) +
        Number(mixInput(nodeId, "Octave Offset")) * 12 +
        Number(mixInput(nodeId, "Pitch Offset"))
      ) || 0));
      value = {
        Frequency: 440 * (2 ** ((pitch - 69) / 12)),
        "Pitch 0-1": pitch / 127,
        "Pitch 0-127": pitch,
      };
    } else if (node?.type === "keyboardController") {
      const signal = nodeGraphMvp?.midiKeyboardSignal || (
        typeof nodeGraphMidiKeyboardFallbackSignal === "function"
          ? nodeGraphMidiKeyboardFallbackSignal()
          : null
      );
      const resetActive = hasInput(nodeId, "Reset") && Number(mixInput(nodeId, "Reset")) > 0;
      const manualRawMidi = Number.isFinite(Number(signal?.rawMidi))
        ? Number(signal.rawMidi)
        : Number(signal?.midi) || 60;
      const manualOctave = Number(signal?.octave) || 0;
      const octave = hasInput(nodeId, "Octave")
        ? Math.max(-6, Math.min(6, Math.round(Number(mixInput(nodeId, "Octave")) || 0)))
        : manualOctave;
      const rawMidi = resetActive
        ? 60
        : (hasInput(nodeId, "MIDI Note") ? Number(mixInput(nodeId, "MIDI Note")) || 0 : manualRawMidi);
      const midi = Math.max(0, Math.min(127, Math.round(rawMidi + octave * 12)));
      const automatedPitch = resetActive || hasInput(nodeId, "MIDI Note") || hasInput(nodeId, "Octave");
      const key = automatedPitch
        ? Math.max(0, Math.min(24, Math.round(rawMidi) - 48))
        : Math.max(0, Math.min(24, Math.round(Number(signal?.keyIndex) || 0)));
      const q = automatedPitch
        ? key / 24
        : Math.max(0, Math.min(1, Number(signal?.keyQuantized) || key / 24));
      const x = resetActive ? 0.5 : (hasInput(nodeId, "X")
        ? Math.max(0, Math.min(1, Number(mixInput(nodeId, "X")) || 0))
        : Math.max(0, Math.min(1, Number(signal?.x) || q)));
      const y = resetActive ? 0 : (hasInput(nodeId, "Y")
        ? Math.max(0, Math.min(1, Number(mixInput(nodeId, "Y")) || 0))
        : Math.max(0, Math.min(1, Number(signal?.y) || 0)));
      const gate = resetActive ? 0 : (hasInput(nodeId, "Gate")
        ? (Number(mixInput(nodeId, "Gate")) > 0 ? 1 : 0)
        : (Number(signal?.gate) > 0 ? 1 : 0));
      const hold = hasInput(nodeId, "Hold") && Number(mixInput(nodeId, "Hold")) > 0 ? 1 : 0;
      const velocity = hasInput(nodeId, "Velocity")
        ? Math.max(0, Math.min(1, Number(mixInput(nodeId, "Velocity")) || 0))
        : y;
      const frequency = Math.max(0, 440 * (2 ** ((midi - 69) / 12)));
      const keyboardRate = Math.max(1, Number(sampleRate) || nodeGraphMvp.sampleRate || 44100);
      const increment = Math.max(0, frequency / keyboardRate);
      value = {
        "1 Sample Gate": hasInput(nodeId, "Gate") ? gate : (Number(signal?.gatePulse) > 0 ? 1 : 0),
        "0.1V/Oct": Math.max(0, Math.min(1, midi / 120)),
        Double: Math.max(0, Math.min(1, midi / 127)),
        Frequency: frequency,
        Gate: Math.max(gate, hold),
        Increment: increment,
        Key: key,
        MIDI: midi,
        Pitch: midi,
        Q: q,
        X: x,
        Y: velocity,
      };
    } else if (node?.type === "buttonEvents") {
      value = {
        Click: nodeGraphExternalButtonEventPulse(runtime, "click"),
        Hover: nodeGraphExternalButtonEventPulse(runtime, "hover"),
        Down: nodeGraphExternalButtonEventPulse(runtime, "down"),
        Up: nodeGraphExternalButtonEventPulse(runtime, "up"),
        Enter: nodeGraphExternalButtonEventPulse(runtime, "enter"),
        Leave: nodeGraphExternalButtonEventPulse(runtime, "leave"),
      };
    } else if (node?.type === "wireBreak") {
      value = nodeGraphWireBreakEventSample(runtime);
    } else if (node?.type === "wireConnect") {
      value = nodeGraphWireConnectEventSample(runtime);
    } else if (node?.type === "wireDisconnect") {
      value = nodeGraphWireDisconnectEventSample(runtime);
    } else if (node?.type === "windowReopen") {
      value = nodeGraphWindowReopenEventSample(runtime);
    } else if (node?.type === "shootingStarExplosion") {
      value = nodeGraphShootingStarExplosionEventSample(
        runtime,
        readNodeGraphLiveEffectiveParam(runtime, node, "lowRange", 0, frame, frames, frameValues),
        readNodeGraphLiveEffectiveParam(runtime, node, "highRange", 1, frame, frames, frameValues),
      );
    } else if (node?.type === "nextPatch" || node?.type === "previousPatch") {
      const state = runtime.patchCommandStates.get(nodeId) || createNodeGraphPatchCommandState();
      runtime.patchCommandStates.set(nodeId, state);
      value = nodeGraphPatchCommandTriggerSample(
        state,
        mixInput(nodeId, "Trigger"),
        readNodeGraphLiveEffectiveParam(runtime, node, "threshold", 0, frame, frames, frameValues),
        node?.type === "previousPatch" ? "previousPatch" : "nextPatch",
        nodeId,
      );
    } else if (node?.type === "macroControls") {
      const resetActive = hasInput(nodeId, "Reset") && Number(mixInput(nodeId, "Reset")) > 0;
      const macros = Array.isArray(nodeGraphMvp?.macroControls) ? nodeGraphMvp.macroControls : [];
      value = {};
      for (let index = 0; index < 10; index += 1) {
        const port = `M${index + 1} In`;
        value[`M${index + 1}`] = resetActive
          ? 0
          : Math.max(0, Math.min(1, hasInput(nodeId, port) ? Number(mixInput(nodeId, port)) || 0 : Number(macros[index]) || 0));
      }
    } else if (node?.type === "pitchModWheel") {
      const resetActive = hasInput(nodeId, "Reset") && Number(mixInput(nodeId, "Reset")) > 0;
      const pitch = resetActive ? 0 : Math.max(-1, Math.min(1, hasInput(nodeId, "Pitch")
        ? Number(mixInput(nodeId, "Pitch")) || 0
        : Number(nodeGraphMvp?.pitchWheelSignal) || 0));
      const mod = resetActive ? 0 : Math.max(0, Math.min(1, hasInput(nodeId, "Mod")
        ? Number(mixInput(nodeId, "Mod")) || 0
        : Number(nodeGraphMvp?.modWheelSignal) || 0));
      value = {
        "Mod Wheel": mod,
        "Pitch Wheel": pitch,
      };
    } else if (node?.type === "gain") {
      value = mixInput(nodeId) * readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        "amount",
        1,
        frame,
        frames,
        frameValues,
      );
    } else if (node?.type === "led") {
      value = {
        Out: nodeGraphSafeFilterNumber(mixInput(nodeId, "In"), runtime, nodeId, null, "led input"),
      };
    } else if (node?.type === "moduleGroup") {
      value = nodeGraphEvaluateModuleGroup(runtime, node, mixInput, sampleRate, frame, frames);
    } else if (node?.type === "codeblock") {
      value = nodeGraphEvaluateCodeblock(runtime, node, mixInput, sampleRate, frame, frames);
    } else if (nodeGraphModuleIsGraphType(node?.type)) {
      value = graphOutputValue(node, nodeId);
    } else if (node?.type === "bias") {
      value = mixInput(nodeId) + readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        "offset",
        0,
        frame,
        frames,
        frameValues,
      );
    } else if (node?.type === "softClipper") {
      value = nodeGraphSoftClipperSample(
        mixInput(nodeId),
        readNodeGraphLiveEffectiveParam(runtime, node, "center", 0, frame, frames, frameValues),
        readNodeGraphLiveEffectiveParam(runtime, node, "width", 2, frame, frames, frameValues),
      );
    } else if (node?.type === "rotate3dTo2d") {
      const angleX = readNodeGraphLiveEffectiveParam(runtime, node, "rotateX", 0, frame, frames, frameValues) * Math.PI * 2;
      const angleY = readNodeGraphLiveEffectiveParam(runtime, node, "rotateY", 0, frame, frames, frameValues) * Math.PI * 2;
      const angleZ = readNodeGraphLiveEffectiveParam(runtime, node, "rotateZ", 0, frame, frames, frameValues) * Math.PI * 2;
      let x = nodeGraphSafeFilterNumber(mixInput(nodeId, "X"), runtime, nodeId, null, "rotation 3d x input");
      let y = nodeGraphSafeFilterNumber(mixInput(nodeId, "Y"), runtime, nodeId, null, "rotation 3d y input");
      let z = nodeGraphSafeFilterNumber(mixInput(nodeId, "Z"), runtime, nodeId, null, "rotation 3d z input");
      const sinX = Math.sin(angleX);
      const cosX = Math.cos(angleX);
      const nextY = y * cosX - z * sinX;
      const nextZ = y * sinX + z * cosX;
      y = nextY;
      z = nextZ;
      const sinY = Math.sin(angleY);
      const cosY = Math.cos(angleY);
      const nextX = x * cosY + z * sinY;
      z = -x * sinY + z * cosY;
      x = nextX;
      const sinZ = Math.sin(angleZ);
      const cosZ = Math.cos(angleZ);
      value = {
        X: nodeGraphSafeFilterNumber(x * cosZ - y * sinZ, runtime, nodeId, null, "rotation 3d x output"),
        Y: nodeGraphSafeFilterNumber(x * sinZ + y * cosZ, runtime, nodeId, null, "rotation 3d y output"),
      };
    } else if (node?.type === "valueSlider") {
      const offset = readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        "offset",
        0,
        frame,
        frames,
        frameValues,
      );
      value = { Bias: offset, Out: offset, offset };
    } else if (node?.type === "macroKnob" || node?.type === "bipolarKnob") {
      const knobValue = readNodeGraphLiveEffectiveParam(
        runtime,
        node,
        "value",
        0,
        frame,
        frames,
        frameValues,
      );
      value = { Out: knobValue, value: knobValue };
    } else if (node?.type === "passiveFilter") {
      const state = runtime.passiveFilterStates.get(nodeId) || createNodeGraphPassiveFilterState();
      runtime.passiveFilterStates.set(nodeId, state);
      value = nodeGraphPassiveFilterSample(
        state,
        mixInput(nodeId),
        readNodeGraphLiveEffectiveParam(runtime, node, "mode", 0, frame, frames, frameValues),
        readNodeGraphLiveEffectiveParam(runtime, node, "lowFrequency", 200, frame, frames, frameValues),
        readNodeGraphLiveEffectiveParam(runtime, node, "highFrequency", 1000, frame, frames, frameValues),
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "cookbookFilter") {
      const state = runtime.cookbookFilterStates.get(nodeId) || createNodeGraphCookbookFilterState();
      runtime.cookbookFilterStates.set(nodeId, state);
      value = nodeGraphCookbookFilterSample(
        state,
        mixInput(nodeId),
        readNodeGraphLiveEffectiveParam(runtime, node, "mode", 1, frame, frames, frameValues),
        readNodeGraphLiveEffectiveParam(runtime, node, "frequency", 1000, frame, frames, frameValues),
        readNodeGraphLiveEffectiveParam(runtime, node, "q", 1, frame, frames, frameValues),
        readNodeGraphLiveEffectiveParam(runtime, node, "gain", 0, frame, frames, frameValues),
        readNodeGraphLiveEffectiveParam(runtime, node, "stages", 2, frame, frames, frameValues),
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "ladderFilter") {
      const state = runtime.ladderFilterStates.get(nodeId) || createNodeGraphLadderFilterState();
      runtime.ladderFilterStates.set(nodeId, state);
      value = nodeGraphLadderFilterSample(
        state,
        mixInput(nodeId),
        {
          frequency: readNodeGraphLiveEffectiveParam(runtime, node, "frequency", 1000, frame, frames, frameValues),
          mode: readNodeGraphLiveEffectiveParam(runtime, node, "mode", 1, frame, frames, frameValues),
          resonance: readNodeGraphLiveEffectiveParam(runtime, node, "resonance", 0.2, frame, frames, frameValues),
          stages: readNodeGraphLiveEffectiveParam(runtime, node, "stages", 4, frame, frames, frameValues),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "tb303Filter") {
      const state = runtime.tb303FilterStates.get(nodeId) || createNodeGraphTb303FilterState();
      runtime.tb303FilterStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphTb303FilterSample(
        state,
        mixInput(nodeId),
        {
          cutoff: read("cutoff", 1000),
          drive: read("drive", 0),
          mode: read("mode", 4),
          resonance: read("resonance", 0),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "delayEffect") {
      const state = runtime.delayEffectStates.get(nodeId) || createNodeGraphDelayEffectState();
      runtime.delayEffectStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphDelayEffectSample(
        state,
        mixInput(nodeId),
        {
          feedback: read("feedback", 0.25),
          level: read("level", 1),
          mix: read("mix", 0.35),
          mode: read("mode", 0),
          modAmount: read("modAmount", 0.02),
          modRate: read("modRate", 0.1),
          modVariation: read("modVariation", 0),
          time: read("time", 0.18),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "reverbEffect") {
      const state = runtime.reverbEffectStates.get(nodeId) || createNodeGraphSabrinaReverbState();
      runtime.reverbEffectStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const leftInput = mixInput(nodeId, "Left");
      const rightInput = hasInput(nodeId, "Right") ? mixInput(nodeId, "Right") : leftInput;
      value = nodeGraphSabrinaReverbSample(
        state,
        leftInput,
        rightInput,
        {
          delaySize: read("delaySize", 0.02),
          diffusionAmount: read("diffusionAmount", 0.70),
          diffusionSize: read("diffusionSize", 0.35),
          lfoAmplitude: read("lfoAmplitude", 0.07),
          lfoBaseSpeed: read("lfoBaseSpeed", 0.83),
          lfoVariation: read("lfoVariation", 0.001),
          mix: read("mix", 0.43),
          recycle: read("recycle", 0.70),
          seed: read("seed", 0),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "pll") {
      const state = runtime.pllStates?.get(nodeId) || createNodeGraphPllState();
      if (runtime.pllStates) runtime.pllStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const cvConnected = hasInput(nodeId, "VCO CV In") ? 1 : 0;
      value = nodeGraphPllSample(
        state,
        mixInput(nodeId, "Signal In"),
        mixInput(nodeId, "VCO CV In"),
        cvConnected,
        {
          range:  read("range",  1),
          offset: read("offset", 5),
          type:   read("type",   1),
          frequ:  read("frequ",  10),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "helmholtzPitch") {
      const state = runtime.helmholtzStates?.get(nodeId) || createNodeGraphHelmholtzState();
      if (runtime.helmholtzStates) runtime.helmholtzStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphHelmholtzSample(
        state,
        mixInput(nodeId, "In"),
        {
          windowSize: read("windowSize", 512),
          threshold: read("threshold", 0.93),
        },
        hasInput(nodeId, "In"),
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "slewLimiter") {
      const state = runtime.slewLimiterStates.get(nodeId) || createNodeGraphSlewLimiterState();
      runtime.slewLimiterStates.set(nodeId, state);
      value = nodeGraphSlewLimiterSample(
        state,
        mixInput(nodeId),
        readNodeGraphLiveEffectiveParam(runtime, node, "upTime", 0.05, frame, frames, frameValues),
        readNodeGraphLiveEffectiveParam(runtime, node, "downTime", 0.20, frame, frames, frameValues),
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "sampleHold") {
      const state = runtime.sampleHoldStates.get(nodeId) || createNodeGraphSampleHoldState();
      runtime.sampleHoldStates.set(nodeId, state);
      value = nodeGraphSampleHoldSample(
        state,
        mixInput(nodeId, "In"),
        mixInput(nodeId, "Trigger"),
        readNodeGraphLiveEffectiveParam(runtime, node, "threshold", 0, frame, frames, frameValues),
        readNodeGraphLiveEffectiveParam(runtime, node, "sampleFrequency", 0, frame, frames, frameValues),
        sampleRate,
        hasInput(nodeId, "In"),
        runtime,
        nodeId,
      );
    } else if (node?.type === "expAdsr") {
      const state = runtime.expAdsrStates.get(nodeId) || createNodeGraphExpAdsrState();
      runtime.expAdsrStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphExpAdsrSample(
        state,
        mixInput(nodeId, "Gate"),
        {
          attack: read("attack", 0.08),
          attackShape: read("attackShape", 0.3),
          decay: read("decay", 0.22),
          delay: read("delay", 0),
          level: read("level", 1),
          loop: read("loop", 0),
          release: read("release", 0.45),
          releaseShape: read("releaseShape", 0.0001),
          sustain: read("sustain", 0.55),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "linearEnvelope") {
      const state = runtime.linearEnvelopeStates.get(nodeId) || createNodeGraphLinearEnvelopeState();
      runtime.linearEnvelopeStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphLinearEnvelopeSample(
        state,
        mixInput(nodeId, "Gate"),
        {
          attack: read("attack", 0.08),
          decay: read("decay", 0.22),
          delay: read("delay", 0),
          level: read("level", 1),
          loop: read("loop", 0),
          release: read("release", 0.45),
          sustain: read("sustain", 0.55),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "pluckEnvelope") {
      const state = runtime.pluckEnvelopeStates.get(nodeId) || createNodeGraphPluckEnvelopeState();
      runtime.pluckEnvelopeStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphPluckEnvelopeSample(
        state,
        mixInput(nodeId, "Trigger"),
        mixInput(nodeId, "Release"),
        {
          attackFeedback: read("attackFeedback", 0.002),
          autoReleaseTime: read("autoReleaseTime", 0.08),
          decay: read("decay", 0.35),
          decayModCurve: read("decayModCurve", 0),
          decayModEnd: read("decayModEnd", 0.55),
          decayModFrequency: read("decayModFrequency", 1.5),
          decayModStart: read("decayModStart", 0.08),
          delayTime: read("delayTime", 0),
          endingDecay: read("endingDecay", 0.8),
          level: read("level", 1),
          releaseFeedback: read("releaseFeedback", 0.35),
          velocity: read("velocity", 1),
          velocitySensitivity: read("velocitySensitivity", 0),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "vactrolEnvelope" || node?.type === "vactrolEnvelopeC4") {
      const state = runtime.vactrolEnvelopeStates.get(nodeId) || createNodeGraphVactrolEnvelopeState();
      runtime.vactrolEnvelopeStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const isC4 = node?.type === "vactrolEnvelopeC4";
      value = nodeGraphVactrolEnvelopeSample(
        state,
        mixInput(nodeId, "Light"),
        {
          attack: read("attack", isC4 ? 0.006 : 0.0025),
          curve: read("curve", 1),
          darkCurrent: read("darkCurrent", 0),
          lightOffset: read("lightOffset", 0),
          release: read("release", isC4 ? 1.5 : 0.035),
          sensitivity: read("sensitivity", 1),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "flowerChildEnvelopeFollower") {
      const state = runtime.flowerChildEnvelopeFollowerStates.get(nodeId) || createNodeGraphFlowerChildEnvelopeFollowerState();
      runtime.flowerChildEnvelopeFollowerStates.set(nodeId, state);
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      value = nodeGraphFlowerChildEnvelopeFollowerSample(
        state,
        mixInput(nodeId),
        {
          attack: read("attack", 0.001),
          decay: read("decay", 0.001),
          hold: read("hold", 0.001),
        },
        sampleRate,
        runtime,
        nodeId,
      );
    } else if (node?.type === "sandboxVisuals") {
      const screenShake = nodeGraphSmoothVisualControl(
        runtime,
        "screenShake",
        nodeGraphVisualControlIntensity(mixInput(nodeId, "Shake"), runtime, nodeId, "screen visuals shake"),
        sampleRate,
      );
      const x = nodeGraphSmoothVisualControl(
        runtime,
        "x",
        nodeGraphVisualControlSigned(mixInput(nodeId, "X"), runtime, nodeId, "sandbox visuals x"),
        sampleRate,
        0.045,
        -1,
        1,
      );
      const y = nodeGraphSmoothVisualControl(
        runtime,
        "y",
        nodeGraphVisualControlSigned(mixInput(nodeId, "Y"), runtime, nodeId, "sandbox visuals y"),
        sampleRate,
        0.045,
        -1,
        1,
      );
      const screenDim = nodeGraphSmoothVisualControl(
        runtime,
        "screenDim",
        nodeGraphVisualControlIntensity(mixInput(nodeId, "Dim"), runtime, nodeId, "screen visuals dim"),
        sampleRate,
      );
      const red = nodeGraphSmoothVisualControl(
        runtime,
        "red",
        nodeGraphVisualControlIntensity(mixInput(nodeId, "Red"), runtime, nodeId, "sandbox visuals red"),
        sampleRate,
      );
      const green = nodeGraphSmoothVisualControl(
        runtime,
        "green",
        nodeGraphVisualControlIntensity(mixInput(nodeId, "Green"), runtime, nodeId, "sandbox visuals green"),
        sampleRate,
      );
      const blue = nodeGraphSmoothVisualControl(
        runtime,
        "blue",
        nodeGraphVisualControlIntensity(mixInput(nodeId, "Blue"), runtime, nodeId, "sandbox visuals blue"),
        sampleRate,
      );
      const scopeTracesOff = nodeGraphSmoothVisualControl(
        runtime,
        "scopeTracesOff",
        nodeGraphVisualControlIntensity(mixInput(nodeId, "Scope Off"), runtime, nodeId, "screen visuals scope off"),
        sampleRate,
        0,
      );
      const scopePaused = nodeGraphSmoothVisualControl(
        runtime,
        "scopePaused",
        nodeGraphVisualControlIntensity(mixInput(nodeId, "Pause"), runtime, nodeId, "screen visuals pause"),
        sampleRate,
        0,
      );
      value = {
        Blue: blue,
        Green: green,
        Pause: scopePaused,
        Red: red,
        ScopeOff: scopeTracesOff,
        ScreenDim: screenDim,
        ScreenShake: screenShake,
        X: x,
        Y: y,
      };
    } else if (node?.type === "screenSpaceShader") {
      value = nodeGraphScreenSpaceShaderSample(
        node,
        (port) => mixInput(nodeId, port),
        runtime,
        nodeId,
        sampleRate,
      );
    } else if (node?.type === "bloomGlow") {
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const screenDim = nodeGraphSmoothVisualControl(
        runtime,
        "screenDim",
        read("screenDim", 0),
        sampleRate,
      );
      const visualBrightness = nodeGraphSmoothVisualControl(
        runtime,
        "visualBrightness",
        read("visualBrightness", 0.55),
        sampleRate,
      );
      const visualBloom = nodeGraphSmoothVisualControl(
        runtime,
        "visualBloom",
        read("visualBloom", 0.45),
        sampleRate,
      );
      const visualGlow = nodeGraphSmoothVisualControl(
        runtime,
        "visualGlow",
        read("visualGlow", 0.6),
        sampleRate,
      );
      value = {
        Bloom: visualBloom,
        Brightness: visualBrightness,
        Dim: screenDim,
        Glow: visualGlow,
      };
    } else if (node?.type === "rgbaHsla") {
      const rgbRed = nodeGraphVisualControlIntensity(mixInput(nodeId, "Red"), runtime, nodeId, "rgba hsla red");
      const rgbGreen = nodeGraphVisualControlIntensity(mixInput(nodeId, "Green"), runtime, nodeId, "rgba hsla green");
      const rgbBlue = nodeGraphVisualControlIntensity(mixInput(nodeId, "Blue"), runtime, nodeId, "rgba hsla blue");
      const hue = nodeGraphVisualControlIntensity(mixInput(nodeId, "Hue"), runtime, nodeId, "rgba hsla hue");
      const saturation = nodeGraphVisualControlIntensity(mixInput(nodeId, "Saturation"), runtime, nodeId, "rgba hsla saturation");
      const lightness = nodeGraphVisualControlIntensity(mixInput(nodeId, "Lightness"), runtime, nodeId, "rgba hsla lightness");
      const hslMix = nodeGraphVisualControlIntensity(mixInput(nodeId, "HSL Mix"), runtime, nodeId, "rgba hsla hsl mix");
      const hslRgb = nodeGraphVisualHslToRgb(hue, saturation, lightness);
      const red = nodeGraphSmoothVisualControl(runtime, "red", rgbRed * (1 - hslMix) + hslRgb[0] * hslMix, sampleRate);
      const green = nodeGraphSmoothVisualControl(runtime, "green", rgbGreen * (1 - hslMix) + hslRgb[1] * hslMix, sampleRate);
      const blue = nodeGraphSmoothVisualControl(runtime, "blue", rgbBlue * (1 - hslMix) + hslRgb[2] * hslMix, sampleRate);
      const alpha = nodeGraphSmoothVisualControl(
        runtime,
        "screenDim",
        nodeGraphVisualControlIntensity(mixInput(nodeId, "Alpha"), runtime, nodeId, "rgba hsla alpha"),
        sampleRate,
      );
      value = { Alpha: alpha, Blue: blue, Green: green, Red: red };
    } else if (node?.type === "chromaColor") {
      const read = (key, fallback) => readNodeGraphLiveEffectiveParam(runtime, node, key, fallback, frame, frames, frameValues);
      const chromaHue = nodeGraphSmoothVisualControl(
        runtime,
        "chromaHue",
        read("chromaHue", 0.58),
        sampleRate,
      );
      const chromaSaturation = nodeGraphSmoothVisualControl(
        runtime,
        "chromaSaturation",
        read("chromaSaturation", 0.82),
        sampleRate,
      );
      const chromaLightness = nodeGraphSmoothVisualControl(
        runtime,
        "chromaLightness",
        read("chromaLightness", 0.52),
        sampleRate,
      );
      const chromaAlpha = nodeGraphSmoothVisualControl(
        runtime,
        "chromaAlpha",
        read("chromaAlpha", 0.35),
        sampleRate,
      );
      const chromaDrift = nodeGraphSmoothVisualControl(
        runtime,
        "chromaDrift",
        read("chromaDrift", 0.25),
        sampleRate,
      );
      const chromaSpread = nodeGraphSmoothVisualControl(
        runtime,
        "chromaSpread",
        read("chromaSpread", 0.4),
        sampleRate,
      );
      const visualBrightness = nodeGraphSmoothVisualControl(
        runtime,
        "visualBrightness",
        read("visualBrightness", 0.55),
        sampleRate,
      );
      const visualBloom = nodeGraphSmoothVisualControl(
        runtime,
        "visualBloom",
        read("visualBloom", 0.45),
        sampleRate,
      );
      const visualGlow = nodeGraphSmoothVisualControl(
        runtime,
        "visualGlow",
        read("visualGlow", 0.6),
        sampleRate,
      );
      value = {
        Alpha: chromaAlpha,
        Bloom: visualBloom,
        Chroma: chromaSaturation,
        Drift: chromaDrift,
        Glow: visualGlow,
        Hue: chromaHue,
        Light: chromaLightness,
        Spread: chromaSpread,
        TraceBrightness: visualBrightness,
      };
    } else if (node?.type === "badvalMonitor") {
      value = nodeGraphBadValueMonitorSample(mixInput(nodeId), runtime, nodeId);
    } else if (node?.type === "speakerProtection") {
      value = nodeGraphSpeakerProtectionSample(mixInput(nodeId), runtime, nodeId);
    } else if (node?.type === "groupOutput") {
      value = {
        Out: mixInput(nodeId, "In"),
      };
    } else if (node?.type === "clapPlugin") {
      const externalOutput = runtime.externalClapOutputs?.get(nodeId);
      if (externalOutput) {
        const absoluteFrame = Number.isFinite(runtime.absoluteFrame) ? runtime.absoluteFrame : frame;
        value = {};
        for (const [port, samples] of Object.entries(externalOutput)) {
          value[port] = nodeGraphSafeFilterNumber(
            Number(samples?.[absoluteFrame]) || 0,
            runtime,
            nodeId,
            null,
            `CLAP ${port} output`,
          );
        }
      } else {
        value = {
          Left: 0,
          Right: 0,
        };
      }
    } else if (node?.type === "output") {
      const mono = mixInput(nodeId, "Mono");
      const left = mixInput(nodeId, "Left");
      const right = mixInput(nodeId, "Right");
      value = {
        Left: mono + left,
        Out: mono + (left + right) * 0.5,
        Right: mono + right,
      };
    }

    frameValues.set(nodeId, value);
    runtime.nodeOutputs?.set(nodeId, value);
  }

  const outputNode = runtime.nodes.get(runtime.outputNode || "output");
  const outputVolume = outputNode
    ? readNodeGraphLiveEffectiveParam(
      runtime,
      outputNode,
      "volume",
      0.1,
      frame,
      frames,
      frameValues,
    )
    : 1;

  const outputMono = mixInput(runtime.outputNode || "output", "Mono");
  return {
    frameValues,
    left: (outputMono + mixInput(runtime.outputNode || "output", "Left")) * outputVolume,
    right: (outputMono + mixInput(runtime.outputNode || "output", "Right")) * outputVolume,
  };
}
