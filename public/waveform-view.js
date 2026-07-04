function setPlayheadFrame(frame) {
  const waveform = state.waveform;
  if (!waveform) {
    state.playheadFrame = 0;
    return;
  }

  state.playheadFrame = Math.min(waveform.frames, Math.max(0, frame));
  renderWaveformPosition();
  drawWaveform();
  drawLevelEnvelope();
  drawSignalPlot();
  renderSignalPlotPoint();
}

async function renderWaveform(path) {
  const status = document.getElementById("waveformStatus");
  const meta = document.getElementById("waveformMeta");
  const canvas = document.getElementById("waveformCanvas");
  status.textContent = "Loading";
  status.className = "pill";

  try {
    const response = await fetch(artifactUrl(path), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`WAV fetch failed: ${response.status}`);
    }

    state.waveform = parsePcm16Wav(await response.arrayBuffer());
    resetWaveformTransientState();
    state.waveform.stats = analyzeWaveform(state.waveform.samples);
    state.waveform.envelope = buildLevelEnvelope(state.waveform);
    state.waveform.regions = buildPhaseRegions(
      state.response?.manifest?.phases || [],
      state.waveform.frames,
    );
    setPlayheadFrame(0);
    drawWaveform();
    renderLevelEnvelope();
    renderPhaseAudioStats();
    renderSignalPlot();
    renderWaveformPhaseControls();
    renderHandsOnReadiness(state.response?.manifest, true);
    const wav = state.response?.manifest?.wav || {};
    const stats = state.waveform.stats;
    canvas.dataset.waveformSource = "decoded primary WAV";
    canvas.dataset.waveformSampleRate = String(state.waveform.sampleRate);
    canvas.dataset.waveformChannels = String(state.waveform.channels);
    canvas.dataset.waveformBitDepth = String(state.waveform.bitsPerSample);
    canvas.dataset.waveformFrames = String(state.waveform.frames);
    canvas.dataset.waveformDataBytes = String(state.waveform.dataBytes);
    canvas.dataset.waveformFileBytes = String(state.waveform.fileBytes);
    canvas.dataset.waveformPeak = formatCompactNumber(stats.peak);
    canvas.dataset.waveformRms = formatCompactNumber(stats.rms);
    canvas.title =
      `Primary WAV waveform / ${state.waveform.frames} frames / ` +
      `${state.waveform.sampleRate} Hz / peak ${formatCompactNumber(stats.peak)} / rms ${formatCompactNumber(stats.rms)}`;
    renderKeyValue(meta, [
      ["sample rate", String(state.waveform.sampleRate), manifestNumberText(wav.sampleRate)],
      ["channels", String(state.waveform.channels), manifestNumberText(wav.channels)],
      ["bit depth", String(state.waveform.bitsPerSample), manifestNumberText(wav.bitDepth)],
      ["frames", String(state.waveform.frames), manifestNumberText(wav.frames)],
      ["data bytes", formatBytes(state.waveform.dataBytes), manifestBytesText(wav.dataBytes)],
      ["file bytes", formatBytes(state.waveform.fileBytes), manifestBytesText(wav.fileBytes)],
      ["peak", formatCompactNumber(stats.peak)],
      ["rms", formatCompactNumber(stats.rms)],
      ["min", formatCompactNumber(stats.min)],
      ["max", formatCompactNumber(stats.max)],
      ["dc offset", formatCompactNumber(stats.dcOffset)],
    ]);
    status.textContent = "Drawn";
    status.className = "pill good";
    renderWaveformPosition();
    renderFollowAudioControl();
  } catch (error) {
    state.waveform = null;
    resetWaveformTransientState();
    state.playheadFrame = 0;
    canvas.dataset.waveformSource = "unavailable";
    canvas.dataset.waveformSampleRate = "unavailable";
    canvas.dataset.waveformChannels = "unavailable";
    canvas.dataset.waveformBitDepth = "unavailable";
    canvas.dataset.waveformFrames = "unavailable";
    canvas.dataset.waveformDataBytes = "unavailable";
    canvas.dataset.waveformFileBytes = "unavailable";
    canvas.dataset.waveformPeak = "unavailable";
    canvas.dataset.waveformRms = "unavailable";
    canvas.title = nodeGraphTooltipText("legacyEvidence.waveformUnavailable");
    renderUnavailableWaveformMeta();
    renderWaveformPhaseControls();
    renderLevelEnvelope();
    renderPhaseAudioStats();
    renderSignalPlot();
    renderHandsOnReadiness(state.response?.manifest, false);
    status.textContent = "Check";
    status.className = "pill warn";
    renderWaveformPosition();
    renderFollowAudioControl();
    console.error(error);
  }
}

function renderUnavailableWaveformMeta() {
  renderKeyValue(document.getElementById("waveformMeta"), [
    ["sample rate", "unavailable", "present"],
    ["channels", "unavailable", "present"],
    ["bit depth", "unavailable", "present"],
    ["frames", "unavailable", "present"],
    ["data bytes", "unavailable", "present"],
    ["source", "manifest/audio required", "decoded primary WAV"],
  ]);
}
