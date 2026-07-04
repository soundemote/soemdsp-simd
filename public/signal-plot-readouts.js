function renderSignalPlotSummary() {
  const waveform = state.waveform;
  const mode = document.getElementById("signalPlotModeSummary");
  const window = document.getElementById("signalPlotWindowSummary");
  const lag = document.getElementById("signalPlotLagSummary");
  const drawableFrames = waveform
    ? Math.max(0, waveform.samples.length - signalPlotLagFrames(waveform))
    : 0;

  mode.textContent = `${signalPlotFocusName(waveform)} / ${state.signalPlotMode} / x${state.signalPlotScale}`;
  window.textContent = waveform
    ? `window ${signalPlotWindowName(waveform, drawableFrames)}`
    : "window full";
  lag.textContent = `lag ${state.signalLagMs} ms`;
}

function renderSignalPlotPoint() {
  const point = document.getElementById("signalPlotPoint");
  const waveform = state.waveform;
  if (!waveform) {
    point.textContent = "frame 0 / phase none / x 0 / y 0";
    return;
  }

  const lagFrames = signalPlotLagFrames(waveform);
  const drawableFrames = Math.max(0, waveform.samples.length - lagFrames);
  const pointFrame = Math.max(
    0,
    Math.min(drawableFrames - 1, state.playheadFrame),
  );
  const x = waveform.samples[pointFrame] || 0;
  const y = waveform.samples[pointFrame + lagFrames] || 0;
  const region = waveformRegionAtFrame(pointFrame);
  point.textContent = `frame ${pointFrame} / ${formatSeconds(pointFrame / waveform.sampleRate)} / ${region?.name || "phase"} / x ${formatCompactNumber(x)} / y ${formatCompactNumber(y)}`;
}
