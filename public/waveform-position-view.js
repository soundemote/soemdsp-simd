function formatRegionRange(region, sampleRate) {
  if (!region || !sampleRate) {
    return "range";
  }

  const frames = Math.max(0, region.endFrame - region.startFrame);
  return `${formatSeconds(region.startFrame / sampleRate)}-${formatSeconds(
    region.endFrame / sampleRate,
  )} / ${frames} frames`;
}

function renderPhaseJumpTarget() {
  const target = document.getElementById("waveformPhaseJumpTarget");
  const waveform = state.waveform;
  const region =
    state.phaseJumpPreviewIndex === null
      ? null
      : waveform?.regions?.[state.phaseJumpPreviewIndex];

  const targetText =
    waveform && region
      ? `jump ${region.name} / ${formatSeconds(
          region.startFrame / waveform.sampleRate,
        )} / frame ${region.startFrame}`
      : "jump idle";
  labelWaveformHeaderPill(target, "phase jump target", targetText, Boolean(waveform));
}

function renderWaveformPosition() {
  const position = document.getElementById("waveformPosition");
  const sample = document.getElementById("waveformSample");
  const phase = document.getElementById("waveformPhase");
  const phaseRange = document.getElementById("waveformPhaseRange");
  const phaseJumpTarget = document.getElementById("waveformPhaseJumpTarget");
  const scrubber = document.getElementById("waveformScrubber");
  const waveform = state.waveform;
  if (!waveform) {
    labelWaveformHeaderPill(position, "waveform position", "0.000s / unknown", false);
    labelWaveformHeaderPill(sample, "waveform sample", "frame 0 / unknown / sample 0", false);
    resetIdleProbePill("waveformProbe", "Waveform probe idle");
    labelWaveformHeaderPill(phase, "waveform phase", "phase", false);
    labelWaveformHeaderPill(phaseRange, "waveform phase range", "range", false);
    phaseJumpTarget.textContent = "jump idle";
    scrubber.value = "0";
    updateWaveformScrubberLabel(scrubber, null, null);
    renderCurrentParameters(null);
    updateParameterTimelinePlayhead(null);
    updatePhaseAudioStatsActive(null);
    updateActivePhaseButtons(null);
    renderInspectionCursor();
    renderParameterTimelineProbe();
    renderPhaseAudioStatsProbe();
    return;
  }

  const activeRegion = activeWaveformRegion();
  const sampleFrame = Math.max(
    0,
    Math.min(waveform.samples.length - 1, state.playheadFrame),
  );
  const sampleValue = waveform.samples[sampleFrame] || 0;
  const positionText = `${formatSeconds(
    state.playheadFrame / waveform.sampleRate,
  )} / ${formatAudioDuration(waveform.frames / waveform.sampleRate)}`;
  const sampleText = `frame ${state.playheadFrame} / ${waveform.frames} / sample ${formatCompactNumber(
    sampleValue,
  )}`;
  const phaseText = activeRegion ? activeRegion.name : "phase";
  const phaseRangeText = formatRegionRange(activeRegion, waveform.sampleRate);
  labelWaveformHeaderPill(position, "waveform position", positionText, true);
  labelWaveformHeaderPill(sample, "waveform sample", sampleText, true);
  labelWaveformHeaderPill(phase, "waveform phase", phaseText, Boolean(activeRegion));
  labelWaveformHeaderPill(
    phaseRange,
    "waveform phase range",
    phaseRangeText,
    Boolean(activeRegion),
  );
  renderCurrentParameters(activeRegion);
  updateParameterTimelinePlayhead(activeRegion);
  updatePhaseAudioStatsActive(activeRegion);
  scrubber.value = String(
    waveform.frames > 0 ? state.playheadFrame / waveform.frames : 0,
  );
  updateWaveformScrubberLabel(scrubber, waveform, activeRegion);
  updateActivePhaseButtons(activeRegion);
  renderWaveformProbe();
}

function updateWaveformScrubberLabel(scrubber, waveform, activeRegion) {
  const followText = state.followAudio ? "follow" : "free";
  const followTitle = state.followAudio ? "Follow Audio" : "Free View";
  if (!waveform) {
    scrubber.setAttribute("aria-valuetext", `0.000s / unknown / phase unknown / ${followText}`);
    scrubber.dataset.followMode = followText;
    scrubber.title = nodeGraphTooltipText("legacyEvidence.waveformPosition", {
      follow: followTitle,
      frame: "unknown",
      phase: "phase unknown",
      time: "0.000s",
    });
    return;
  }

  const timeText = formatSeconds(state.playheadFrame / waveform.sampleRate);
  const durationText = formatAudioDuration(waveform.frames / waveform.sampleRate);
  const phaseText = activeRegion?.name || "phase unknown";
  scrubber.setAttribute(
    "aria-valuetext",
    `${timeText} / ${durationText} / frame ${state.playheadFrame} / ${phaseText} / ${followText}`,
  );
  scrubber.dataset.followMode = followText;
  scrubber.title = nodeGraphTooltipText("legacyEvidence.waveformPosition", {
    follow: followTitle,
    frame: state.playheadFrame,
    phase: phaseText,
    time: timeText,
  });
}

function renderWaveformProbe() {
  const probe = document.getElementById("waveformProbe");
  const waveform = state.waveform;
  if (!waveform || state.waveformProbeFrame === null) {
    resetIdleProbePill("waveformProbe", "Waveform probe idle");
    renderInspectionCursor();
    renderParameterTimelineProbe();
    renderPhaseAudioStatsProbe();
    renderPhaseProbe();
    return;
  }

  const frame = clampFrame(state.waveformProbeFrame, waveform);
  const sampleFrame = Math.max(0, Math.min(waveform.samples.length - 1, frame));
  const sampleValue = waveform.samples[sampleFrame] || 0;
  const region = waveformRegionAtFrame(frame);
  const source = currentProbeSource();
  probe.textContent = `${probeSourceText()} ${formatSeconds(
    frame / waveform.sampleRate,
  )} / frame ${frame} / ${formatCompactNumber(sampleValue)} / ${
    region?.name || "phase"
  }`;
  setProbePillMetadata(
    probe,
    source,
    frame,
    `Waveform probe ${source} / ${formatSeconds(
      frame / waveform.sampleRate,
    )} / frame ${frame} / ${region?.name || "phase"}`,
  );
  renderInspectionCursor();
  renderParameterTimelineProbe();
  renderPhaseAudioStatsProbe();
  renderPhaseProbe();
}
