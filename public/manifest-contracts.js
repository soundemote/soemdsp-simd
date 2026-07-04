function manifestShapeError(payload) {
  const manifest = payload.manifest;
  if (!manifest || typeof manifest !== "object") {
    return "manifest object missing";
  }

  const handoff = manifest.sandboxHandoff;
  if (!handoff || typeof handoff !== "object") {
    return "sandbox handoff missing";
  }

  if (typeof handoff.entryPoint !== "string" || !handoff.entryPoint) {
    return "sandbox entry point missing";
  }

  if (
    typeof handoff.primaryAudioArtifact !== "string" ||
    !handoff.primaryAudioArtifact
  ) {
    return "primary audio artifact missing";
  }

  if (!manifest.wav || typeof manifest.wav !== "object") {
    return "wav metadata missing";
  }

  if (!isPositiveFiniteNumber(manifest.wav.frames)) {
    return "wav frame count missing";
  }

  for (const [key, message] of [
    ["sampleRate", "wav sample rate missing"],
    ["channels", "wav channel count missing"],
    ["bitDepth", "wav bit depth missing"],
    ["dataBytes", "wav data byte count missing"],
    ["fileBytes", "wav file byte count missing"],
  ]) {
    if (!isPositiveFiniteNumber(manifest.wav[key])) {
      return message;
    }
  }

  if (!Array.isArray(manifest.artifactLinks)) {
    return "artifact links missing";
  }

  for (const kind of ["entry-point", "audio", "manifest", "text-summary", "wav-report"]) {
    if (countArtifactKind(manifest.artifactLinks, kind) !== 1) {
      return `${kind} artifact link count mismatch`;
    }
  }

  if (findArtifactPath(manifest.artifactLinks, "entry-point") !== handoff.entryPoint) {
    return "entry-point link mismatch";
  }

  if (
    findArtifactPath(manifest.artifactLinks, "audio") !==
    handoff.primaryAudioArtifact
  ) {
    return "audio link mismatch";
  }

  if (!Array.isArray(manifest.phases)) {
    return "phases missing";
  }

  const phaseReportIssue = phaseReportCoverageIssue(manifest);
  if (phaseReportIssue) {
    return phaseReportIssue;
  }

  const parameterResyncIssue = parameterResyncContractIssue(manifest);
  if (parameterResyncIssue) {
    return parameterResyncIssue;
  }

  const phaseAudioIssues = phaseAudioMeasurementIssues(manifest);
  if (phaseAudioIssues.length) {
    return phaseAudioIssues[0];
  }

  const callerProcessingIssue = callerProcessingOrderIssue(manifest);
  if (callerProcessingIssue) {
    return callerProcessingIssue;
  }

  return "";
}
