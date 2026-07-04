function levelEnvelopeWindowAtFrame(frame) {
  const windows = state.waveform?.envelope?.windows || [];
  if (windows.length === 0) {
    return null;
  }

  return (
    windows.find((entry) => frame >= entry.startFrame && frame < entry.endFrame) ||
    windows.at(-1)
  );
}

function renderLevelEnvelopeProbe() {
  const probe = document.getElementById("levelEnvelopeProbe");
  const waveform = state.waveform;
  if (!waveform || state.waveformProbeFrame === null) {
    resetIdleProbePill("levelEnvelopeProbe", "Level envelope probe idle");
    return;
  }

  const frame = clampFrame(state.waveformProbeFrame, waveform);
  const entry = levelEnvelopeWindowAtFrame(frame);
  const region = waveformRegionAtFrame(frame);
  const source = currentProbeSource();
  probe.textContent = entry
    ? `${probeSourceText()} ${formatProbeFrame(frame, waveform, region)} / peak ${formatCompactNumber(
        entry.peak,
      )} / rms ${formatCompactNumber(entry.rms)}`
    : "probe";
  setProbePillMetadata(
    probe,
    source,
    frame,
    entry
      ? `Level envelope probe ${source} / ${formatProbeFrame(frame, waveform, region)} / peak ${formatCompactNumber(
          entry.peak,
        )} / rms ${formatCompactNumber(entry.rms)}`
      : `Level envelope probe ${source} / ${formatProbeFrame(frame, waveform, region)} / no envelope window`,
  );
}

function renderLevelEnvelope() {
  const status = document.getElementById("levelEnvelopeStatus");
  const meta = document.getElementById("levelEnvelopeMeta");
  const peak = document.getElementById("levelEnvelopePeak");
  const rms = document.getElementById("levelEnvelopeRms");
  const canvas = document.getElementById("levelEnvelopeCanvas");
  const waveform = state.waveform;
  const envelope = waveform?.envelope;

  if (!waveform || !envelope) {
    canvas.dataset.envelopeSource = "unavailable";
    canvas.dataset.envelopeWindowMs = "unavailable";
    canvas.dataset.envelopeWindowFrames = "unavailable";
    canvas.dataset.envelopeWindows = "unavailable";
    canvas.dataset.envelopePeak = "unavailable";
    canvas.dataset.envelopeRms = "unavailable";
    canvas.dataset.envelopeFrames = "unavailable";
    canvas.title = nodeGraphTooltipText("legacyEvidence.levelEnvelopeUnavailable");
    peak.textContent = "peak 0";
    rms.textContent = "rms 0";
    renderLevelEnvelopeProbe();
    status.textContent = "Check";
    status.className = "pill warn";
    renderUnavailableLevelEnvelopeMeta();
    return;
  }

  peak.textContent = `peak ${formatCompactNumber(envelope.peak)}`;
  rms.textContent = `rms ${formatCompactNumber(envelope.rms)}`;
  canvas.dataset.envelopeSource = "decoded primary WAV";
  canvas.dataset.envelopeWindowMs = String(envelope.windowMs);
  canvas.dataset.envelopeWindowFrames = String(envelope.windowFrames);
  canvas.dataset.envelopeWindows = String(envelope.windows.length);
  canvas.dataset.envelopePeak = formatCompactNumber(envelope.peak);
  canvas.dataset.envelopeRms = formatCompactNumber(envelope.rms);
  canvas.dataset.envelopeFrames = String(waveform.frames);
  canvas.title =
    `Primary WAV level envelope / ${formatCompactNumber(envelope.windowMs)} ms window / ` +
    `${envelope.windows.length} windows / peak ${formatCompactNumber(envelope.peak)} / rms ${formatCompactNumber(envelope.rms)}`;
  renderLevelEnvelopeProbe();
  renderKeyValue(meta, [
    ["window", `${formatCompactNumber(envelope.windowMs)} ms`],
    ["window frames", String(envelope.windowFrames)],
    ["windows", String(envelope.windows.length)],
    ["peak", formatCompactNumber(envelope.peak)],
    ["rms", formatCompactNumber(envelope.rms)],
    ["source", "decoded primary WAV"],
  ]);
  drawLevelEnvelope();
  status.textContent = "Drawn";
  status.className = "pill good";
}

function renderUnavailableLevelEnvelopeMeta() {
  renderKeyValue(document.getElementById("levelEnvelopeMeta"), [
    ["window", "unavailable", "present"],
    ["windows", "unavailable", "present"],
    ["peak", "unavailable", "present"],
    ["rms", "unavailable", "present"],
    ["source", "manifest/audio required", "decoded primary WAV"],
  ]);
}
