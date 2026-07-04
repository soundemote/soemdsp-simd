function createNodeGraphLorenzAttractorState() {
  return {
    resetWasHigh: false,
    x: 0.1,
    y: 0,
    z: 0,
  };
}

function resetNodeGraphLorenzAttractorState(state) {
  state.x = 0.1;
  state.y = 0;
  state.z = 0;
}

function nodeGraphLorenzAttractorSample(options = {}) {
  const state = options.state || createNodeGraphLorenzAttractorState();
  const resetHigh = Number(options.reset) > 0.5;
  if (resetHigh && !state.resetWasHigh) {
    resetNodeGraphLorenzAttractorState(state);
  }
  state.resetWasHigh = resetHigh;

  const sampleRate = Math.max(1, Number(options.sampleRate) || 44100);
  const speed = Math.max(0, Number(options.speed) || 0);
  const sigma = Math.max(0, Number(options.sigma) || 10);
  const rho = Number.isFinite(Number(options.rho)) ? Number(options.rho) : 28;
  const beta = Math.max(0, Number(options.beta) || 8 / 3);
  const dt = (0.75 * speed) / sampleRate;
  const steps = Math.max(1, Math.ceil(dt / 0.0007));
  const stepDt = steps > 0 ? dt / steps : 0;

  for (let index = 0; index < steps; index += 1) {
    const dx = sigma * (state.y - state.x);
    const dy = state.x * (rho - state.z) - state.y;
    const dz = state.x * state.y - beta * state.z;
    state.x += dx * stepDt;
    state.y += dy * stepDt;
    state.z += dz * stepDt;
    if (!Number.isFinite(state.x) || !Number.isFinite(state.y) || !Number.isFinite(state.z)) {
      resetNodeGraphLorenzAttractorState(state);
      break;
    }
  }

  const rotate = (Number(options.rotate) || 0) * Math.PI * 2;
  const cosRotate = Math.cos(rotate);
  const sinRotate = Math.sin(rotate);
  const normalizedX = state.x / 24;
  const normalizedY = state.y / 32;
  const normalizedZ = (state.z - 25) / 30;
  const depth = Math.max(0, Math.min(1, Number(options.zDepth) || 0));
  const depthScale = 1 + normalizedZ * depth * 0.35;
  const scale = Math.max(0, Number(options.scale) || 1) * depthScale;
  const x = (normalizedX * cosRotate - normalizedY * sinRotate) * scale;
  const y = (normalizedX * sinRotate + normalizedY * cosRotate) * scale;
  const z = normalizedZ * scale;
  return {
    x: Math.max(-1, Math.min(1, x)),
    y: Math.max(-1, Math.min(1, y)),
    z: Math.max(-1, Math.min(1, z)),
  };
}
