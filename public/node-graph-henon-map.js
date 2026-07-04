function createNodeGraphHenonMapState() {
  return { hasStarted: false, phase: 0, x: 0, y: 0 };
}

function resetNodeGraphHenonMapState(state, seedX, seedY) {
  state.x = Math.max(-1, Math.min(1, Number(seedX) || 0));
  state.y = Math.max(-1, Math.min(1, Number(seedY) || 0));
  state.phase = 0;
  state.hasStarted = true;
}

// Discrete 2D chaotic map (x, y) = (1 - a*x^2 + y, b*x), stepped forward by a
// clocked Rate (Hz) like Logistic Map. Mirrors native_modules/henon_map
// exactly; offline/JS path only, the realtime worklet prefers native WASM.
function nodeGraphHenonMapSample(options = {}) {
  const state = options.state || createNodeGraphHenonMapState();
  const resetActive = Number(options.reset) > 0;
  const sampleRateValue = Math.max(1, Number(options.sampleRate) || 44100);
  const rate = Math.max(0, Number(options.rate) || 0);
  const a = Math.max(0, Math.min(2, Number(options.a) || 0));
  const b = Math.max(-1, Math.min(1, Number(options.b) || 0));
  const seedX = Number(options.seedX) || 0;
  const seedY = Number(options.seedY) || 0;

  if (resetActive || !state.hasStarted) {
    resetNodeGraphHenonMapState(state, seedX, seedY);
  }

  if (!resetActive && rate > 0) {
    state.phase += rate / sampleRateValue;
    let iterations = 0;
    while (state.phase >= 1 && iterations < 4096) {
      state.phase -= 1;
      const nextX = 1 - a * state.x * state.x + state.y;
      const nextY = b * state.x;
      state.x = Math.max(-4, Math.min(4, nextX));
      state.y = Math.max(-4, Math.min(4, nextY));
      iterations += 1;
    }
    if (state.phase >= 1) {
      state.phase = 0;
    }
  }

  return {
    x: Math.max(-1, Math.min(1, state.x / 1.5)),
    y: Math.max(-1, Math.min(1, state.y / 0.45)),
  };
}
