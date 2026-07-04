function seekWaveformAtClientX(clientX) {
  const waveform = state.waveform;
  if (!waveform) {
    return;
  }

  seekPrimaryAudioToFrame(waveformFrameAtClientX(clientX), inspectionSources.waveform);
}

function waveformFrameAtClientX(clientX) {
  return waveformFrameAtClientXForCanvas(clientX, "waveformCanvas");
}

function waveformFrameAtClientXForCanvas(clientX, canvasId) {
  const waveform = state.waveform;
  if (!waveform) {
    return 0;
  }

  const canvas = document.getElementById(canvasId);
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
  return clampFrame(Math.round(ratio * waveform.frames), waveform);
}

function probeWaveformAtClientX(clientX) {
  if (!state.waveform) {
    return;
  }

  state.waveformProbeFrame = waveformFrameAtClientX(clientX);
  state.waveformProbeSource = inspectionSources.waveform;
  state.signalPlotProbe = signalPlotProbeAtFrame(state.waveformProbeFrame);
  renderWaveformProbe();
  drawSignalPlot();
  renderSignalPlotProbe();
  drawLevelEnvelope();
}

function probeLevelEnvelopeAtClientX(clientX) {
  if (!state.waveform) {
    return;
  }

  state.waveformProbeFrame = waveformFrameAtClientXForCanvas(clientX, "levelEnvelopeCanvas");
  state.waveformProbeSource = inspectionSources.levelEnvelope;
  state.signalPlotProbe = signalPlotProbeAtFrame(state.waveformProbeFrame);
  renderWaveformProbe();
  drawWaveform();
  drawLevelEnvelope();
  drawSignalPlot();
  renderSignalPlotProbe();
  renderLevelEnvelopeProbe();
}

function seekWaveform(event) {
  probeWaveformAtClientX(event.clientX);
  seekWaveformAtClientX(event.clientX);
}

function beginWaveformDrag(event) {
  state.waveformPointerActive = true;
  event.currentTarget.classList.add("dragging");
  event.currentTarget.setPointerCapture(event.pointerId);
  probeWaveformAtClientX(event.clientX);
  seekWaveformAtClientX(event.clientX);
}

function dragWaveform(event) {
  probeWaveformAtClientX(event.clientX);
  if (!state.waveformPointerActive) {
    return;
  }

  seekWaveformAtClientX(event.clientX);
}

function endWaveformDrag(event) {
  state.waveformPointerActive = false;
  event.currentTarget.classList.remove("dragging");
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
}

function clearWaveformProbe() {
  if (state.waveformPointerActive) {
    return;
  }

  resetSharedProbeState();
  renderWaveformProbe();
  drawSignalPlot();
  renderSignalPlotProbe();
  drawLevelEnvelope();
  renderLevelEnvelopeProbe();
}

function clearLevelEnvelopeProbe() {
  if (state.waveformPointerActive) {
    return;
  }

  resetSharedProbeState();
  renderWaveformProbe();
  renderLevelEnvelopeProbe();
  drawWaveform();
  drawLevelEnvelope();
  drawSignalPlot();
  renderSignalPlotProbe();
}

function scrubWaveform(event) {
  const waveform = state.waveform;
  if (!waveform) {
    return;
  }

  const ratio = Number(event.currentTarget.value);
  seekPrimaryAudioToFrame(Math.round(ratio * waveform.frames), inspectionSources.scrubber);
}

function beginScrubberDrag(event) {
  state.scrubberPointerActive = true;
  event.currentTarget.setPointerCapture(event.pointerId);
}

function endScrubberDrag(event) {
  state.scrubberPointerActive = false;
  if (event.currentTarget.hasPointerCapture(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
}

function toggleFollowAudio() {
  setFollowAudio(!state.followAudio, true);
}
