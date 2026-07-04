function parameterResyncContractIssue(manifest) {
  const resync = manifest?.parameterResync;
  if (!resync || typeof resync !== "object") {
    return "parameter resync missing";
  }

  for (const key of ["frequency", "amplitude"]) {
    const values = resync[key];
    if (!values || typeof values !== "object") {
      return `${key} resync missing`;
    }
    if (values.changed !== true) {
      return `${key} resync changed flag missing`;
    }

    const first = Number(values.first);
    const second = Number(values.second);
    if (!Number.isFinite(first) || first <= 0) {
      return `${key} first value invalid`;
    }
    if (!Number.isFinite(second) || second <= 0) {
      return `${key} second value invalid`;
    }
    if (second <= first) {
      return `${key} did not resync upward`;
    }
  }

  return "";
}

function phaseReportCoverageIssue(manifest) {
  const phases = Array.isArray(manifest?.phases) ? manifest.phases : [];
  const links = Array.isArray(manifest?.artifactLinks) ? manifest.artifactLinks : [];
  const phaseReports = links.filter(
    (link) => link?.kind === "phase-report" && Boolean(link.path),
  );

  if (phaseReports.length !== phases.length) {
    return "phase report count mismatch";
  }

  const phaseNames = new Set();
  for (const phase of phases) {
    if (typeof phase?.name !== "string" || !phase.name) {
      return "phase name missing";
    }
    phaseNames.add(phase.name);
  }

  const reportPhases = new Set();
  for (const link of phaseReports) {
    if (typeof link.phase !== "string" || !link.phase) {
      return "phase report phase missing";
    }
    if (!phaseNames.has(link.phase)) {
      return "phase report phase unknown";
    }
    if (reportPhases.has(link.phase)) {
      return "phase report phase duplicate";
    }
    reportPhases.add(link.phase);
  }

  for (const name of phaseNames) {
    if (!reportPhases.has(name)) {
      return "phase report phase missing";
    }
  }

  return "";
}

function phaseAudioMeasurementIssues(manifest) {
  const phases = Array.isArray(manifest?.phases) ? manifest.phases : [];
  const measurements = manifest?.phaseAudioMeasurements;
  const resync = manifest?.parameterResync || {};
  const frequency = resync.frequency || {};
  const amplitude = resync.amplitude || {};
  const bias = resync.bias || {};

  if (!Array.isArray(measurements)) {
    return ["phase audio measurements missing"];
  }

  if (measurements.length !== phases.length) {
    return ["phase audio measurement count mismatch"];
  }

  const measurementsByName = new Map();
  for (const measurement of measurements) {
    if (!measurement || typeof measurement !== "object") {
      return ["phase audio measurement invalid"];
    }
    if (typeof measurement.name !== "string" || !measurement.name) {
      return ["phase audio measurement name missing"];
    }
    measurementsByName.set(measurement.name, measurement);
  }

  for (const phase of phases) {
    const name = phase?.name;
    if (typeof name !== "string" || !name) {
      return ["phase name missing"];
    }

    const measurement = measurementsByName.get(name);
    if (!measurement) {
      return [`${name} phase audio measurement missing`];
    }

    const measuredFrequency = Number(measurement.measuredFrequency);
    const peak = Number(measurement.peak);
    const rms = Number(measurement.rms);
    const min = Number(measurement.min);
    const max = Number(measurement.max);
    const dcOffset = Number(measurement.dcOffset);
    if (
      !Number.isFinite(measuredFrequency) ||
      !Number.isFinite(peak) ||
      !Number.isFinite(rms) ||
      !Number.isFinite(min) ||
      !Number.isFinite(max) ||
      !Number.isFinite(dcOffset)
    ) {
      return [`${name} phase audio measurement values missing`];
    }

    if (measuredFrequency <= 0 || peak <= 0 || rms <= 0) {
      return [`${name} phase audio measurement values invalid`];
    }

    const targetFrequency = Number(frequency[name]);
    const targetAmplitude = Number(amplitude[name]);
    const targetBias =
      bias[name] === undefined || bias[name] === null ? 0 : Number(bias[name]);
    const targetPeak =
      targetAmplitude + (Number.isFinite(targetBias) ? Math.abs(targetBias) : 0);
    if (
      !Number.isFinite(targetFrequency) ||
      Math.abs(measuredFrequency - targetFrequency) >
        phaseAudioFrequencyToleranceHz
    ) {
      return [`${name} phase audio frequency mismatch`];
    }
    if (
      !Number.isFinite(targetAmplitude) ||
      !Number.isFinite(targetPeak) ||
      Math.abs(peak - targetPeak) > phaseAudioAmplitudeTolerance
    ) {
      return [`${name} phase audio peak mismatch`];
    }
    if (
      !Number.isFinite(targetBias) ||
      Math.abs(dcOffset - targetBias) > phaseAudioAmplitudeTolerance
    ) {
      return [`${name} phase audio dc offset mismatch`];
    }
  }

  return [];
}
