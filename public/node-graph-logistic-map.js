function createNodeGraphLogisticMapState() {
  return {
    hasStarted: false,
    phase: 0,
    x: 0.5,
  };
}

function resetNodeGraphLogisticMapState(state, seed) {
  state.x = Math.max(0.0001, Math.min(0.9999, Number(seed) || 0.5));
  state.phase = 0;
  state.hasStarted = true;
}

// Discrete chaotic map: x = r * x * (1 - x), stepped forward by a clocked
// Rate (Hz) rather than once per audio sample, so slow settings behave like
// an LFO/CV source and high settings push into audio-rate chaotic texture.
// Mirrors native_modules/logistic_map/logistic_map.cpp exactly (same reset
// semantics, same runaway-rate iteration cap) -- this is the offline/JS path;
// the realtime audio worklet prefers the native WASM build of the same math.
function nodeGraphLogisticMapSample(options = {}) {
  const state = options.state || createNodeGraphLogisticMapState();
  const resetActive = Number(options.reset) > 0;
  const sampleRateValue = Math.max(1, Number(options.sampleRate) || 44100);
  const rate = Math.max(0, Number(options.rate) || 0);
  const r = Math.max(0, Math.min(4, Number(options.r) || 0));
  const seed = Math.max(0.0001, Math.min(0.9999, Number(options.seed) || 0.5));
  const level = Number(options.level) || 0;

  if (resetActive || !state.hasStarted) {
    resetNodeGraphLogisticMapState(state, seed);
  }

  if (!resetActive && rate > 0) {
    state.phase += rate / sampleRateValue;
    let iterations = 0;
    while (state.phase >= 1 && iterations < 4096) {
      state.phase -= 1;
      state.x = Math.max(0, Math.min(1, r * state.x * (1 - state.x)));
      iterations += 1;
    }
    if (state.phase >= 1) {
      // Rate is absurdly high relative to sample rate -- drop the remainder
      // rather than spend the whole frame iterating.
      state.phase = 0;
    }
  }

  const bipolar = state.x * 2 - 1;
  return bipolar * level;
}
