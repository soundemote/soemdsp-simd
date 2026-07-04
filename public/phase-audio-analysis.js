function activeWaveformRegion() {
  const waveform = state.waveform;
  if (!waveform) {
    return null;
  }

  return waveformRegionAtFrame(state.playheadFrame);
}

function waveformRegionAtFrame(frame) {
  return waveformRegionAtFrameFor(state.waveform, frame);
}

function waveformRegionAtFrameFor(waveform, frame) {
  if (!waveform) {
    return null;
  }

  return (
    (waveform.regions || []).find(
      (region) =>
        frame >= region.startFrame &&
        frame < region.endFrame,
    ) || waveform.regions?.at(-1) || null
  );
}

function activeParameterValue(name, region) {
  const resync = state.response?.manifest?.parameterResync || {};
  const values = resync[name] || {};
  const number = Number(values[region?.name]);
  return Number.isFinite(number) ? number : null;
}

function producerPhaseAudioMeasurement(region) {
  const measurements = state.response?.manifest?.phaseAudioMeasurements || [];
  if (!Array.isArray(measurements) || !region) {
    return null;
  }

  return (
    measurements.find((measurement) => measurement?.name === region.name) || null
  );
}

function measuredPhaseAudio(region) {
  const waveform = state.waveform;
  if (!waveform || !region) {
    return null;
  }

  const stats = analyzeSampleRange(
    waveform.samples,
    region.startFrame,
    region.endFrame,
  );
  return {
    frequency: estimateZeroCrossingFrequency(
      waveform.samples,
      region.startFrame,
      region.endFrame,
      waveform.sampleRate,
    ),
    peak: stats.peak,
    dcOffset: stats.dcOffset,
  };
}

function targetPeakFor(targetAmplitude, targetBias) {
  if (targetAmplitude === null) {
    return null;
  }
  return targetAmplitude + Math.abs(targetBias || 0);
}

function measuredPhaseAudioMatches(measurement, targetFrequency, targetAmplitude, targetBias = 0) {
  const targetPeak = targetPeakFor(targetAmplitude, targetBias);
  return (
    measurement !== null &&
    Number.isFinite(measurement.frequency) &&
    Number.isFinite(measurement.peak) &&
    Number.isFinite(measurement.dcOffset) &&
    targetFrequency !== null &&
    targetPeak !== null &&
    Math.abs(measurement.frequency - targetFrequency) <= phaseAudioFrequencyToleranceHz &&
    Math.abs(measurement.peak - targetPeak) <= phaseAudioAmplitudeTolerance &&
    Math.abs(measurement.dcOffset - (targetBias || 0)) <= phaseAudioAmplitudeTolerance
  );
}

function measuredPhaseDelta(measuredValue, targetValue) {
  if (!Number.isFinite(measuredValue) || targetValue === null) {
    return null;
  }

  return measuredValue - targetValue;
}
