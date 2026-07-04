function renderPhaseAudioStats() {
  const status = document.getElementById("phaseAudioStatsStatus");
  const list = document.getElementById("phaseAudioStats");
  list.replaceChildren();

  const waveform = state.waveform;
  const regions = waveform?.regions || [];
  if (!waveform || !regions.length) {
    renderUnavailablePhaseAudioStats();
    renderPhaseAudioStatsProbe();
    status.textContent = "Check";
    status.className = "pill warn";
    return;
  }

  let allOk = true;
  for (const region of regions) {
    const stats = analyzeSampleRange(
      waveform.samples,
      region.startFrame,
      region.endFrame,
    );
    const frequencyValue = activeParameterValue("frequency", region);
    const amplitudeValue = activeParameterValue("amplitude", region);
    const biasValue = activeParameterValue("bias", region) ?? 0;
    const targetPeak = targetPeakFor(amplitudeValue, biasValue);
    const measuredFrequency = estimateZeroCrossingFrequency(
      waveform.samples,
      region.startFrame,
      region.endFrame,
      waveform.sampleRate,
    );
    const producerMeasurement = producerPhaseAudioMeasurement(region);
    const producerFrequency = Number(producerMeasurement?.measuredFrequency);
    const producerPeak = Number(producerMeasurement?.peak);
    const producerRms = Number(producerMeasurement?.rms);
    const producerFrequencyDelta =
      measuredFrequency === null || !Number.isFinite(producerFrequency)
        ? null
        : measuredFrequency - producerFrequency;
    const producerPeakDelta = !Number.isFinite(producerPeak)
      ? null
      : stats.peak - producerPeak;
    const producerRmsDelta = !Number.isFinite(producerRms)
      ? null
      : stats.rms - producerRms;
    const producerOk =
      producerMeasurement &&
      producerFrequencyDelta !== null &&
      Math.abs(producerFrequencyDelta) <= phaseAudioFrequencyToleranceHz &&
      producerPeakDelta !== null &&
      Math.abs(producerPeakDelta) <= phaseAudioAmplitudeTolerance &&
      producerRmsDelta !== null &&
      Math.abs(producerRmsDelta) <= phaseAudioRmsTolerance;
    allOk = allOk && producerOk;
    const targetFrequencyText =
      frequencyValue === null ? "missing" : `${formatCompactNumber(frequencyValue)} Hz`;
    const measuredFrequencyText =
      measuredFrequency === null ? "missing" : `${formatCompactNumber(measuredFrequency)} Hz`;
    const targetAmplitudeText =
      amplitudeValue === null ? "missing" : formatCompactNumber(amplitudeValue);
    const targetPeakText =
      targetPeak === null ? "missing" : formatCompactNumber(targetPeak);
    const peakText = formatCompactNumber(stats.peak);
    const rmsText = formatCompactNumber(stats.rms);
    const startTime = formatSeconds(region.startFrame / waveform.sampleRate);
    const endTime = formatSeconds(region.endFrame / waveform.sampleRate);
    const itemLabel =
      `Phase audio stats ${region.name} from frame ${region.startFrame} to ${region.endFrame}`;

    const item = document.createElement("div");
    item.className = producerOk ? "phase-stat" : "phase-stat warn-row";
    item.dataset.phaseName = region.name;
    item.dataset.startFrame = String(region.startFrame);
    item.dataset.endFrame = String(region.endFrame);
    item.dataset.startTime = startTime;
    item.dataset.endTime = endTime;
    item.dataset.targetFrequency = targetFrequencyText;
    item.dataset.measuredFrequency = measuredFrequencyText;
    item.dataset.targetAmplitude = targetPeakText;
    item.dataset.peak = peakText;
    item.dataset.rms = rmsText;
    item.dataset.producerMatch = String(Boolean(producerOk));
    item.setAttribute("aria-label", itemLabel);
    item.setAttribute("role", "group");
    item.title =
      `${itemLabel} / target ${targetFrequencyText} / measured ${measuredFrequencyText} / ` +
      `peak ${peakText} / producer ${producerOk ? "match" : "check"}`;
    item.addEventListener("pointermove", probePhaseAudioStats);
    item.addEventListener("pointerleave", clearPhaseAudioStatsProbe);

    const name = document.createElement("h3");
    name.textContent = region.name;

    const body = document.createElement("dl");
    body.className = "kv compact";
    const frequencyDelta =
      measuredFrequency === null || frequencyValue === null
        ? "missing"
        : formatSignedNumber(measuredFrequency - frequencyValue);
    const producerFrequencyDeltaText =
      producerFrequencyDelta === null
        ? "missing"
        : formatSignedNumber(producerFrequencyDelta);
    const peakDelta =
      targetPeak === null ? "missing" : formatSignedNumber(stats.peak - targetPeak);
    const producerPeakDeltaText =
      producerPeakDelta === null
        ? "missing"
        : formatSignedNumber(producerPeakDelta);
    const producerRmsDeltaText =
      producerRmsDelta === null ? "missing" : formatSignedNumber(producerRmsDelta);
    renderKeyValue(body, [
      ["target freq", targetFrequencyText],
      ["measured freq", measuredFrequencyText],
      ["freq delta", frequencyDelta],
      ["producer freq", Number.isFinite(producerFrequency) ? `${formatCompactNumber(producerFrequency)} Hz` : "missing"],
      ["producer freq delta", producerFrequencyDeltaText],
      ["target amp", targetAmplitudeText],
      ["target bias", formatCompactNumber(biasValue)],
      ["target peak", targetPeakText],
      ["peak", peakText],
      ["peak delta", peakDelta],
      ["producer peak", Number.isFinite(producerPeak) ? formatCompactNumber(producerPeak) : "missing"],
      ["producer peak delta", producerPeakDeltaText],
      ["rms", rmsText],
      ["producer rms", Number.isFinite(producerRms) ? formatCompactNumber(producerRms) : "missing"],
      ["producer rms delta", producerRmsDeltaText],
      ["min", formatCompactNumber(stats.min)],
      ["max", formatCompactNumber(stats.max)],
      ["dc offset", formatCompactNumber(stats.dcOffset)],
    ]);

    item.append(name, body);
    list.append(item);
  }

  status.textContent = allOk ? "Verified" : "Check";
  status.className = `pill ${allOk ? "good" : "warn"}`;
  updatePhaseAudioStatsActive(activeWaveformRegion());
  renderPhaseAudioStatsProbe();
}

function renderUnavailablePhaseAudioStats() {
  const list = document.getElementById("phaseAudioStats");
  list.replaceChildren();

  const item = document.createElement("div");
  item.className = "phase-stat warn-row";
  item.dataset.phaseName = "unavailable";
  item.dataset.startFrame = "none";
  item.dataset.endFrame = "none";
  item.dataset.startTime = "unavailable";
  item.dataset.endTime = "unavailable";
  item.dataset.targetFrequency = "unavailable";
  item.dataset.measuredFrequency = "unavailable";
  item.dataset.targetAmplitude = "unavailable";
  item.dataset.peak = "unavailable";
  item.dataset.rms = "unavailable";
  item.dataset.producerMatch = "false";
  item.setAttribute("aria-label", "Phase audio stats unavailable: manifest required");
  item.setAttribute("role", "group");
  item.title = nodeGraphTooltipText("legacyEvidence.phaseAudioStatsUnavailable");

  const name = document.createElement("h3");
  name.textContent = "Phase audio stats unavailable";

  const body = document.createElement("dl");
  body.className = "kv compact";
  renderKeyValue(body, [
    ["decoded waveform", "unavailable", "present"],
    ["phase ranges", "unavailable", "present"],
    ["producer compare", "unavailable", "present"],
  ]);

  item.append(name, body);
  list.append(item);
}
