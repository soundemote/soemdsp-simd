function renderCurrentParameters(region) {
  const frequency = document.getElementById("currentFrequency");
  const amplitude = document.getElementById("currentAmplitude");
  const measuredFrequency = document.getElementById("currentMeasuredFrequency");
  const measuredPeak = document.getElementById("currentMeasuredPeak");
  const measuredFrequencyDelta = document.getElementById("currentMeasuredFrequencyDelta");
  const measuredPeakDelta = document.getElementById("currentMeasuredPeakDelta");
  const measuredStatus = document.getElementById("currentMeasuredStatus");
  const status = document.getElementById("currentParameterStatus");
  const frequencyValue = activeParameterValue("frequency", region);
  const amplitudeValue = activeParameterValue("amplitude", region);
  const biasValue = activeParameterValue("bias", region) ?? 0;
  const targetPeak = targetPeakFor(amplitudeValue, biasValue);
  const measurement = measuredPhaseAudio(region);
  const frequencyDelta = measuredPhaseDelta(measurement?.frequency, frequencyValue);
  const peakDelta = measuredPhaseDelta(measurement?.peak, targetPeak);
  const ok = frequencyValue !== null && amplitudeValue !== null;
  const measurementOk = measuredPhaseAudioMatches(
    measurement,
    frequencyValue,
    amplitudeValue,
    biasValue,
  );

  const frequencyText =
    frequencyValue === null ? "freq" : `freq ${formatCompactNumber(frequencyValue)} Hz`;
  const amplitudeText =
    amplitudeValue === null ? "amp" : `amp ${formatCompactNumber(amplitudeValue)}`;
  const measuredFrequencyText =
    measurement?.frequency === null || measurement?.frequency === undefined
      ? "measured freq"
      : `measured ${formatCompactNumber(measurement.frequency)} Hz`;
  const measuredPeakText =
    measurement ? `peak ${formatCompactNumber(measurement.peak)}` : "peak";
  const measuredFrequencyDeltaText =
    frequencyDelta === null ? "freq delta" : `freq delta ${formatSignedNumber(frequencyDelta)}`;
  const measuredPeakDeltaText =
    peakDelta === null ? "peak delta" : `peak delta ${formatSignedNumber(peakDelta)}`;
  const measuredStatusText = measurementOk
    ? "measured ok"
    : measurement
      ? "measured mismatch"
      : "measured missing";
  const statusText = ok ? `params ${region?.name || "synced"}` : "params missing";

  labelWaveformHeaderPill(frequency, "current frequency", frequencyText, frequencyValue !== null);
  labelWaveformHeaderPill(amplitude, "current amplitude", amplitudeText, amplitudeValue !== null);
  labelWaveformHeaderPill(
    measuredFrequency,
    "current measured frequency",
    measuredFrequencyText,
    Boolean(measurement),
  );
  labelWaveformHeaderPill(measuredPeak, "current measured peak", measuredPeakText, Boolean(measurement));
  labelWaveformHeaderPill(
    measuredFrequencyDelta,
    "current measured frequency delta",
    measuredFrequencyDeltaText,
    frequencyDelta !== null,
  );
  labelWaveformHeaderPill(
    measuredPeakDelta,
    "current measured peak delta",
    measuredPeakDeltaText,
    peakDelta !== null,
  );
  labelWaveformHeaderPill(measuredStatus, "current measured status", measuredStatusText, measurementOk);
  measuredStatus.className = `pill ${measurementOk ? "good" : "warn"}`;
  labelWaveformHeaderPill(status, "current parameter status", statusText, ok);
  status.className = `pill ${ok ? "good" : "warn"}`;
}
