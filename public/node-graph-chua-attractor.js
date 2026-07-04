function createNodeGraphChuaAttractorState() {
  return { resetWasHigh: false, x: 0.1, y: 0, z: 0 };
}

function resetNodeGraphChuaAttractorState(state) {
  state.x = 0.1;
  state.y = 0;
  state.z = 0;
}

function nodeGraphChuaDiode(x, m0, m1) {
  return m1 * x + 0.5 * (m0 - m1) * (Math.abs(x + 1) - Math.abs(x - 1));
}

// Chua's Circuit double-scroll attractor. Mirrors
// native_modules/chua_attractor exactly (same diode nonlinearity, same fixed-
// substep Euler integration); offline/JS path only, the realtime worklet
// prefers native WASM.
function nodeGraphChuaAttractorSample(options = {}) {
  const state = options.state || createNodeGraphChuaAttractorState();
  const resetHigh = Number(options.reset) > 0.5;
  if (resetHigh && !state.resetWasHigh) {
    resetNodeGraphChuaAttractorState(state);
  }
  state.resetWasHigh = resetHigh;

  const sampleRateValue = Math.max(1, Number(options.sampleRate) || 44100);
  const speed = Math.max(0, Number(options.speed) || 0);
  const alpha = Number(options.alpha) || 0;
  const beta = Number(options.beta) || 0;
  const m0 = Number(options.m0) || 0;
  const m1 = Number(options.m1) || 0;
  const dt = (0.6 * speed) / sampleRateValue;
  const steps = Math.max(1, Math.ceil(dt / 0.0004));
  const stepDt = steps > 0 ? dt / steps : 0;

  for (let i = 0; i < steps; i += 1) {
    const fx = nodeGraphChuaDiode(state.x, m0, m1);
    const dx = alpha * (state.y - state.x - fx);
    const dy = state.x - state.y + state.z;
    const dz = -beta * state.y;
    state.x += dx * stepDt;
    state.y += dy * stepDt;
    state.z += dz * stepDt;
    if (!Number.isFinite(state.x) || !Number.isFinite(state.y) || !Number.isFinite(state.z)) {
      resetNodeGraphChuaAttractorState(state);
      break;
    }
  }
  state.x = Math.max(-20, Math.min(20, state.x));
  state.y = Math.max(-20, Math.min(20, state.y));
  state.z = Math.max(-20, Math.min(20, state.z));

  return {
    x: Math.max(-1, Math.min(1, state.x / 2.0)),
    y: Math.max(-1, Math.min(1, state.y / 0.5)),
    z: Math.max(-1, Math.min(1, state.z / 3.5)),
  };
}
