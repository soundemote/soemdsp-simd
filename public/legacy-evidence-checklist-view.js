function validateConsumerChecklist(manifest) {
  const handoff = manifest.sandboxHandoff || {};
  const links = manifest.artifactLinks || [];
  const phases = manifest.phases || [];
  const phaseAudioIssues = phaseAudioMeasurementIssues(manifest);
  const phaseReportIssue = phaseReportCoverageIssue(manifest);
  const parameterResyncIssue = parameterResyncContractIssue(manifest);
  const callerProcessingIssue = callerProcessingOrderIssue(manifest);
  const entryPointPath = findArtifactPath(links, "entry-point");
  const primaryAudioPath = findArtifactPath(links, "audio");
  const checks = [
    ["allOk", manifest.allOk === true],
    ["contract", handoff.contract === expectedContract],
    ["contractVersion", handoff.contractVersion === expectedContractVersion],
    ["inspectionMode", handoff.inspectionMode === expectedInspectionMode],
    ["entryPoint", Boolean(handoff.entryPoint)],
    ["primaryAudioArtifact", Boolean(handoff.primaryAudioArtifact)],
    ...requiredFlags.map(([key, expected]) => [
      key,
      handoff[key] === expected,
    ]),
    ["entry-point link", hasArtifactKind(links, "entry-point")],
    ["entry-point matches handoff", entryPointPath === handoff.entryPoint],
    ["audio link", hasArtifactKind(links, "audio")],
    ["audio matches handoff", primaryAudioPath === handoff.primaryAudioArtifact],
    ["phase report", phases.length > 0],
    ["phase report coverage", phaseReportIssue === ""],
    ["parameter resync", parameterResyncIssue === ""],
    ["phase audio measurements", phaseAudioIssues.length === 0],
    ["caller processing order", callerProcessingIssue === ""],
  ];

  return {
    accepted: checks.every(([, ok]) => ok),
    checks,
  };
}

function renderChecklist(result) {
  const list = document.getElementById("checklist");
  renderCheckRows(list, result.checks);
}

function renderUnavailableChecklist() {
  renderCheckRows(document.getElementById("checklist"), [
    ["manifest loaded", false],
    ["sandbox handoff", false],
    ["artifact links", false],
  ]);
}

function renderCheckRows(container, rows) {
  container.replaceChildren();
  for (const [label, ok] of rows) {
    const stateName = ok ? "ok" : "check";
    const item = document.createElement("div");
    item.className = ok ? "check-row" : "check-row warn-row";
    item.dataset.checkLabel = label;
    item.dataset.checkState = stateName;
    item.setAttribute("role", "group");
    item.setAttribute("aria-label", `${label}: ${stateName}`);
    item.title = nodeGraphTooltipText("legacyEvidence.sourceValue", {
      key: label,
      value: stateName,
    });

    const marker = document.createElement("strong");
    marker.textContent = ok ? "OK" : "Check";

    const text = document.createElement("span");
    text.textContent = label;

    item.append(marker, text);
    container.append(item);
  }
}
