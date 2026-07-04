function renderArtifactCoverage(manifest) {
  const links = manifest.artifactLinks || [];
  const phases = manifest.phases || [];
  const handoff = manifest.sandboxHandoff || {};
  const phaseReportCount = countArtifactKind(links, "phase-report");
  const missingPathCount = links.filter((link) => !link.path).length;
  const entryPointPath = findArtifactPath(links, "entry-point");
  const primaryAudioPath = findArtifactPath(links, "audio");
  const entryPointMatches = entryPointPath === handoff.entryPoint;
  const primaryAudioMatches = primaryAudioPath === handoff.primaryAudioArtifact;
  const phaseReportIssue = phaseReportCoverageIssue(manifest);
  const rows = [
    ["total links", String(links.length)],
    ["missing paths", String(missingPathCount), 0],
    ["reachability method", "HEAD", "HEAD"],
    ["entry point", String(countArtifactKind(links, "entry-point")), 1],
    ["entry point path", entryPointMatches ? "match" : "mismatch", "match"],
    ["audio", String(countArtifactKind(links, "audio")), 1],
    ["audio path", primaryAudioMatches ? "match" : "mismatch", "match"],
    ["manifest", String(countArtifactKind(links, "manifest")), 1],
    ["text summary", String(countArtifactKind(links, "text-summary")), 1],
    ["wav report", String(countArtifactKind(links, "wav-report")), 1],
    ["phase reports", String(phaseReportCount), phases.length],
    ["phase report coverage", phaseReportIssue === "" ? "match" : phaseReportIssue, "match"],
  ];
  const ok =
    links.length > 0 &&
    missingPathCount === 0 &&
    countArtifactKind(links, "entry-point") === 1 &&
    countArtifactKind(links, "audio") === 1 &&
    entryPointMatches &&
    primaryAudioMatches &&
    countArtifactKind(links, "manifest") === 1 &&
    countArtifactKind(links, "text-summary") === 1 &&
    countArtifactKind(links, "wav-report") === 1 &&
    phaseReportCount === phases.length &&
    phaseReportIssue === "";

  setStatus("artifactCoverageStatus", ok ? "Complete" : "Check", ok);
  renderKeyValue(document.getElementById("artifactCoverage"), rows);
}

function renderUnavailableArtifactCoverage() {
  renderKeyValue(document.getElementById("artifactCoverage"), [
    ["artifact links", "unavailable", "available"],
    ["entry point", "unavailable", "present"],
    ["audio", "unavailable", "present"],
    ["phase reports", "unavailable", "present"],
  ]);
}
