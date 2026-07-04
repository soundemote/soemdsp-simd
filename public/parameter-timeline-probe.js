function parameterTimelineRows(manifest) {
  const resync = manifest?.parameterResync || {};
  return Object.entries(resync)
    .filter(([_name, values]) => values && typeof values === "object")
    .map(([name, values]) => [name, values]);
}

function updateParameterTimelinePlayhead(region) {
  const timeline = document.getElementById("parameterTimeline");
  const phase = document.getElementById("parameterTimelinePhase");
  const marker = document.getElementById("parameterTimelinePlayhead");
  const waveform = state.waveform;

  const frequency = activeParameterValue("frequency", region);
  const amplitude = activeParameterValue("amplitude", region);
  phase.textContent = region
    ? `phase ${region.name} / freq ${
        frequency === null ? "missing" : `${formatCompactNumber(frequency)} Hz`
      } / amp ${amplitude === null ? "missing" : formatCompactNumber(amplitude)}`
    : "phase";
  for (const segment of timeline.querySelectorAll(".parameter-segment")) {
    segment.classList.toggle("active", segment.dataset.phaseName === region?.name);
  }

  if (!marker || !waveform || waveform.frames <= 0) {
    return;
  }

  const labelWidth = timeline.querySelector(".parameter-track-label")?.offsetWidth || 0;
  const trackGap = 12;
  const timelinePadding = 12;
  const railLeft = timelinePadding + labelWidth + trackGap;
  const railWidth = Math.max(1, timeline.clientWidth - railLeft - timelinePadding);
  const ratio = Math.max(0, Math.min(1, state.playheadFrame / waveform.frames));
  marker.style.left = `${railLeft + ratio * railWidth}px`;
}

function updateParameterTimelinePreview(region) {
  for (const segment of document.querySelectorAll(".parameter-segment")) {
    segment.classList.toggle("preview", segment.dataset.phaseName === region?.name);
  }
}

function updateParameterTimelineProbeMarker() {
  const timeline = document.getElementById("parameterTimeline");
  const marker = document.getElementById("parameterTimelineProbeMarker");
  const waveform = state.waveform;
  if (!marker) {
    return;
  }

  if (!waveform || waveform.frames <= 0 || state.waveformProbeFrame === null) {
    marker.hidden = true;
    return;
  }

  const labelWidth = timeline.querySelector(".parameter-track-label")?.offsetWidth || 0;
  const trackGap = 12;
  const timelinePadding = 12;
  const railLeft = timelinePadding + labelWidth + trackGap;
  const railWidth = Math.max(1, timeline.clientWidth - railLeft - timelinePadding);
  const ratio = Math.max(
    0,
    Math.min(1, clampFrame(state.waveformProbeFrame, waveform) / waveform.frames),
  );
  marker.hidden = false;
  marker.style.left = `${railLeft + ratio * railWidth}px`;
}

function renderParameterTimelineProbe() {
  const probe = document.getElementById("parameterTimelineProbe");
  const waveform = state.waveform;
  if (!waveform || state.waveformProbeFrame === null) {
    resetIdleProbePill("parameterTimelineProbe", "Parameter timeline probe idle");
    updateParameterTimelinePreview(null);
    updateParameterTimelineProbeMarker();
    return;
  }

  const frame = clampFrame(state.waveformProbeFrame, waveform);
  const region = waveformRegionAtFrame(frame);
  const frequency = activeParameterValue("frequency", region);
  const amplitude = activeParameterValue("amplitude", region);
  const source = currentProbeSource();
  const frequencyText = frequency === null ? "missing" : `${formatCompactNumber(frequency)} Hz`;
  const amplitudeText = amplitude === null ? "missing" : formatCompactNumber(amplitude);
  probe.textContent = `${probeSourceText()} ${formatProbeFrame(frame, waveform, region)} / freq ${
    frequencyText
  } / amp ${amplitudeText}`;
  setProbePillMetadata(
    probe,
    source,
    frame,
    `Parameter timeline probe ${source} / ${formatProbeFrame(
      frame,
      waveform,
      region,
    )} / freq ${frequencyText} / amp ${amplitudeText}`,
  );
  updateParameterTimelinePreview(region);
  updateParameterTimelineProbeMarker();
}

function probeParameterTimelineSegment(event) {
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

  const rect = event.currentTarget.getBoundingClientRect();
  const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
  state.waveformProbeFrame = clampFrame(
    Math.round(startFrame + (endFrame - startFrame) * ratio),
    waveform,
  );
  state.waveformProbeSource = inspectionSources.parameterTimeline;
  state.signalPlotProbe = signalPlotProbeAtFrame(state.waveformProbeFrame);
  renderWaveformProbe();
  renderLevelEnvelopeProbe();
  renderParameterTimelineProbe();
  drawWaveform();
  drawLevelEnvelope();
  drawSignalPlot();
  renderSignalPlotProbe();
}

function clearParameterTimelineProbe() {
  if (state.waveformPointerActive) {
    return;
  }

  resetSharedProbeState();
  renderWaveformProbe();
  renderLevelEnvelopeProbe();
  renderParameterTimelineProbe();
  drawWaveform();
  drawLevelEnvelope();
  drawSignalPlot();
  renderSignalPlotProbe();
}
