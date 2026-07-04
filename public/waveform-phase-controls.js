function renderWaveformPhaseControls() {
  const container = document.getElementById("waveformPhaseControls");
  container.replaceChildren();

  const waveform = state.waveform;
  if (!waveform) {
    return;
  }

  for (const [index, region] of (waveform.regions || []).entries()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "phase-button";
    button.dataset.phaseIndex = String(index);
    button.dataset.phaseName = region.name || "";
    button.dataset.phaseStartFrame = String(region.startFrame);
    button.dataset.phaseEndFrame = String(region.endFrame);
    button.dataset.phaseStartTime = formatSeconds(region.startFrame / waveform.sampleRate);
    button.dataset.phaseEndTime = formatSeconds(region.endFrame / waveform.sampleRate);
    button.setAttribute(
      "aria-label",
      `Jump waveform to ${region.name} phase from frame ${region.startFrame} to ${region.endFrame}`,
    );
    button.title =
      `Jump to ${region.name} from ${button.dataset.phaseStartTime} to ${button.dataset.phaseEndTime}`;
    button.textContent = region.name;
    button.classList.toggle("preview", index === state.phaseJumpPreviewIndex);
    button.addEventListener("pointermove", () => probePhaseButton(index));
    button.addEventListener("pointerleave", clearPhaseButtonProbe);
    button.addEventListener("focus", () => probePhaseButton(index));
    button.addEventListener("blur", clearPhaseButtonProbe);
    button.addEventListener("click", () => {
      seekPrimaryAudioToFrame(region.startFrame, inspectionSources.phaseJump);
    });
    container.append(button);
  }
}

function setSharedProbeFrame(frame, source = inspectionModes.probe) {
  const waveform = state.waveform;
  if (!waveform) {
    return;
  }

  state.waveformProbeFrame = clampFrame(frame, waveform);
  state.waveformProbeSource = source;
  state.signalPlotProbe = signalPlotProbeAtFrame(state.waveformProbeFrame);
  renderWaveformProbe();
  renderLevelEnvelopeProbe();
  renderPhaseProbe();
  renderPhaseAudioStatsProbe();
  renderParameterTimelineProbe();
  drawWaveform();
  drawLevelEnvelope();
  drawSignalPlot();
  renderSignalPlotProbe();
}

function clearSharedProbeFrame() {
  resetSharedProbeState();
  renderWaveformProbe();
  renderLevelEnvelopeProbe();
  renderPhaseProbe();
  renderPhaseAudioStatsProbe();
  renderParameterTimelineProbe();
  drawWaveform();
  drawLevelEnvelope();
  drawSignalPlot();
  renderSignalPlotProbe();
}

function probePhaseButton(index) {
  const region = state.waveform?.regions?.[index];
  if (!region) {
    return;
  }

  state.phaseJumpPreviewIndex = index;
  updateActivePhaseButtons(activeWaveformRegion());
  setSharedProbeFrame(region.startFrame, inspectionSources.phaseJump);
}

function clearPhaseButtonProbe() {
  if (state.waveformPointerActive) {
    return;
  }

  state.phaseJumpPreviewIndex = null;
  updateActivePhaseButtons(activeWaveformRegion());
  clearSharedProbeFrame();
}

function clearPhaseButtonProbeFromOutside(event) {
  if (state.phaseJumpPreviewIndex === null || state.waveformPointerActive) {
    return;
  }

  const target = event.target;
  if (target instanceof Element && target.closest("#waveformPhaseControls")) {
    return;
  }

  clearPhaseButtonProbe();
}
