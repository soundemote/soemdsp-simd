function renderPhaseProbe() {
  const probe = document.getElementById("phaseProbe");
  const waveform = state.waveform;
  if (!waveform || state.waveformProbeFrame === null) {
    resetIdleProbePill("phaseProbe", "Phase list probe idle");
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
      ? `Phase list probe ${source} / ${formatProbeFrame(frame, waveform, region)}`
      : `Phase list probe ${source} / ${formatProbeFrame(frame, waveform, region)} / no phase`,
  );
  updatePhaseProbeTargets();
}

function probePhaseList(event) {
  const waveform = state.waveform;
  if (!waveform) {
    return;
  }

  const startFrame = Number(event.currentTarget.dataset.startFrame);
  const endFrame = Number(event.currentTarget.dataset.endFrame);
  if (!Number.isFinite(startFrame) || !Number.isFinite(endFrame) || endFrame <= startFrame) {
    return;
  }

  state.waveformProbeFrame = clampFrame(Math.round(startFrame + (endFrame - startFrame) / 2), waveform);
  state.waveformProbeSource = inspectionSources.phaseList;
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

function clearPhaseListProbe() {
  if (state.waveformPointerActive) {
    return;
  }

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

function renderPhases(phases, wav) {
  const status = document.getElementById("phaseStatus");
  const list = document.getElementById("phaseList");
  list.replaceChildren();
  const sampleRate = Number(wav?.sampleRate || 0);
  const totalFrames = Number(wav?.frames || 0);
  const spans = buildPhaseSpans(phases, totalFrames);
  const totalPhaseFrames = phaseFrameTotal(phases);
  const ok = phases.length > 0 && totalFrames > 0 && totalPhaseFrames === totalFrames;
  setStatus("phaseStatus", ok ? `${phases.length} OK` : "Check", ok);

  for (const [index, phase] of phases.entries()) {
    const span = spans[index];
    const duration =
      sampleRate > 0 ? formatSeconds(span.frames / sampleRate) : "unavailable";
    const startTime =
      sampleRate > 0 ? formatSeconds(span.startFrame / sampleRate) : "unavailable";
    const endTime =
      sampleRate > 0 ? formatSeconds(span.endFrame / sampleRate) : "unavailable";
    const share =
      totalFrames > 0
        ? formatPercent((span.frames / totalFrames) * 100)
        : "unavailable";
    const itemLabel =
      `Phase ${phase.name || "phase"} from frame ${span.startFrame} to ${span.endFrame}`;
    const item = document.createElement("div");
    item.className = "phase";
    item.dataset.phaseIndex = String(index);
    item.dataset.phaseName = phase.name || "";
    item.dataset.startFrame = String(span.startFrame);
    item.dataset.endFrame = String(span.endFrame);
    item.dataset.startTime = startTime;
    item.dataset.endTime = endTime;
    item.dataset.duration = duration;
    item.dataset.wavShare = share;
    item.setAttribute("aria-label", itemLabel);
    item.setAttribute("role", "group");
    item.title = nodeGraphTooltipText("legacyEvidence.phaseListItem", {
      duration,
      end: endTime,
      label: itemLabel,
      start: startTime,
    });
    item.addEventListener("pointermove", probePhaseList);
    item.addEventListener("pointerleave", clearPhaseListProbe);

    const name = document.createElement("h3");
    name.textContent = phase.name;

    const body = document.createElement("dl");
    body.className = "kv compact";
    renderKeyValue(body, [
      ["preflight", boolText(phase.preflightOk), true],
      ["apply", boolText(phase.applyOk), true],
      ["process", boolText(phase.processOk), true],
      ["bindings", String(phase.bindingsChecked)],
      ["parameters", String(phase.parametersApplied)],
      ["samples", String(phase.samplesProcessed)],
      ["time range", formatPhaseRange(span, sampleRate)],
      ["duration", duration],
      ["wav share", share],
    ]);

    item.append(name, body);
    list.append(item);
  }
  renderPhaseProbe();
}

function renderUnavailablePhases() {
  const list = document.getElementById("phaseList");
  list.replaceChildren();

  const item = document.createElement("div");
  item.className = "phase warn-row";
  item.dataset.phaseIndex = "none";
  item.dataset.phaseName = "unavailable";
  item.dataset.startFrame = "none";
  item.dataset.endFrame = "none";
  item.dataset.startTime = "unavailable";
  item.dataset.endTime = "unavailable";
  item.dataset.duration = "unavailable";
  item.dataset.wavShare = "unavailable";
  item.setAttribute("aria-label", "Phase list unavailable: manifest required");
  item.setAttribute("role", "group");
  item.title = nodeGraphTooltipText("legacyEvidence.phaseListUnavailable");

  const name = document.createElement("h3");
  name.textContent = "Phases unavailable";

  const body = document.createElement("dl");
  body.className = "kv compact";
  renderKeyValue(body, [
    ["phase count", "unavailable", "present"],
    ["frame ranges", "unavailable", "present"],
    ["resync proof", "unavailable", "present"],
  ]);

  item.append(name, body);
  list.append(item);
  renderPhaseProbe();
}
