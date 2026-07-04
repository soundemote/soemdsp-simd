function updatePhaseAudioStatsActive(region) {
  for (const item of document.querySelectorAll(".phase-stat")) {
    item.classList.toggle("active", item.dataset.phaseName === region?.name);
  }
}

function updatePhaseProbeTargets() {
  const region =
    state.waveform && state.waveformProbeFrame !== null
      ? waveformRegionAtFrame(clampFrame(state.waveformProbeFrame, state.waveform))
      : null;

  for (const item of document.querySelectorAll(".phase, .phase-stat")) {
    item.classList.toggle("preview", item.dataset.phaseName === region?.name);
  }
}

function renderPhaseAudioStatsProbe() {
  const probe = document.getElementById("phaseAudioStatsProbe");
  const waveform = state.waveform;
  if (!waveform || state.waveformProbeFrame === null) {
    resetIdleProbePill("phaseAudioStatsProbe", "Phase audio stats probe idle");
    updatePhaseProbeTargets();
    return;
  }

  const frame = clampFrame(state.waveformProbeFrame, waveform);
  const region = waveformRegionAtFrame(frame);
  const source = currentProbeSource();
  probe.textContent = region
    ? `${probeSourceText()} ${formatProbeFrame(frame, waveform, region)}`
    : "probe";
  setProbePillMetadata(
    probe,
    source,
    frame,
    region
      ? `Phase audio stats probe ${source} / ${formatProbeFrame(frame, waveform, region)}`
      : `Phase audio stats probe ${source} / ${formatProbeFrame(
          frame,
          waveform,
          region,
        )} / no phase`,
  );
  updatePhaseProbeTargets();
}

function probePhaseAudioStats(event) {
  const waveform = state.waveform;
  if (!waveform) {
    return;
  }

  const startFrame = Number(event.currentTarget.dataset.startFrame);
  const endFrame = Number(event.currentTarget.dataset.endFrame);
  if (
    !Number.isFinite(startFrame) ||
    !Number.isFinite(endFrame) ||
    endFrame <= startFrame
  ) {
    return;
  }

  state.waveformProbeFrame = clampFrame(
    Math.round(startFrame + (endFrame - startFrame) / 2),
    waveform,
  );
  state.waveformProbeSource = inspectionSources.phaseAudioStats;
  state.signalPlotProbe = signalPlotProbeAtFrame(state.waveformProbeFrame);
  renderWaveformProbe();
  renderLevelEnvelopeProbe();
  renderPhaseAudioStatsProbe();
  renderParameterTimelineProbe();
  drawWaveform();
  drawLevelEnvelope();
  drawSignalPlot();
  renderSignalPlotProbe();
}

function clearPhaseAudioStatsProbe() {
  if (state.waveformPointerActive) {
    return;
  }

  resetSharedProbeState();
  renderWaveformProbe();
  renderLevelEnvelopeProbe();
  renderPhaseAudioStatsProbe();
  renderParameterTimelineProbe();
  drawWaveform();
  drawLevelEnvelope();
  drawSignalPlot();
  renderSignalPlotProbe();
}
