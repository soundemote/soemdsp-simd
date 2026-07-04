function createNodeGraphTuringMachineState() {
  return {
    clockWasHigh: false,
    resetWasHigh: false,
    register: 0,
    selfClockPhase: 0,
    selfClockValue: 0,
  };
}

// Unwired Clock defaults to 0, a constant -- a bare Turing Machine would
// never advance. So an unwired Clock free-runs at the module's own
// Frequency parameter instead, letting it do something on its own without
// requiring a separate Clock module wired in.
function nodeGraphAdvanceTuringMachineSelfClock(state, frequencyHz, sampleRate) {
  const safeFrequency = Math.max(0.001, Number(frequencyHz) || 4);
  const safeRateValue = Math.max(1, Number(sampleRate) || 44100);
  const increment = (2 * safeFrequency) / safeRateValue;
  state.selfClockPhase = (state.selfClockPhase || 0) + increment;
  if (state.selfClockPhase >= 1) {
    state.selfClockPhase -= Math.floor(state.selfClockPhase);
    state.selfClockValue = state.selfClockValue ? 0 : 1;
  }
  return state.selfClockValue || 0;
}

// Classic mutating shift-register sequencer: each Clock edge, the register
// shifts left by one bit; the bit shifted off the top becomes the candidate
// new bottom bit, and with the given Probability it's flipped instead of
// kept -- low probability repeats the same loop indefinitely, high
// probability drifts toward pure randomness. Length bounds the loop to
// 1-16 bits. Scale exposes the low 12 bits as a pitch-class bitmask (bit i =
// pitch class i), matching the sandbox's bitmask convention elsewhere.
function nodeGraphTuringMachineSample(state, options = {}) {
  const clockHigh = Number(options.clock) > 0;
  const resetHigh = Number(options.reset) > 0;
  const length = Math.max(1, Math.min(16, Math.round(Number(options.length) || 8)));
  const probability = Math.max(0, Math.min(1, Number(options.probability) || 0));
  const level = Number(options.level) || 0;

  if (resetHigh && !state.resetWasHigh) {
    state.register = 0;
  }
  state.resetWasHigh = resetHigh;

  if (clockHigh && !state.clockWasHigh) {
    const mask = (1 << length) - 1;
    const topBit = (state.register >> (length - 1)) & 1;
    const newBit = Math.random() < probability ? 1 - topBit : topBit;
    state.register = ((state.register << 1) | newBit) & mask;
  }
  state.clockWasHigh = clockHigh;

  const mask = (1 << length) - 1;
  const maxValue = mask > 0 ? mask : 1;
  const cv = (state.register / maxValue) * 2 - 1;
  const scaleMask = state.register & 0xFFF;
  const gate = state.register & 1;

  return {
    CV: cv * level,
    Scale: scaleMask,
    Gate: gate * level,
  };
}
