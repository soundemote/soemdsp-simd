function renderProducerProof(manifest) {
  const setters = manifest.parameterSetters || {};
  const phaseAudioIssues = phaseAudioMeasurementIssues(manifest);
  const callerProcessingIssue = callerProcessingOrderIssue(manifest);
  const rows = [
    ["demo", manifest.demo || "missing"],
    ["kind", manifest.kind || "missing"],
    ["runtime API", boolText(Boolean(manifest.runtimeApi)), false],
    ["scheduler", boolText(Boolean(manifest.scheduler)), false],
    ["audio engine", boolText(Boolean(manifest.audioEngine)), false],
    ["frequency setter", boolText(Boolean(setters.frequency)), true],
    ["amplitude setter", boolText(Boolean(setters.amplitude)), true],
    ...(setters.bias !== undefined
      ? [["bias setter", boolText(Boolean(setters.bias)), true]]
      : []),
    ["phase measurements", boolText(phaseAudioIssues.length === 0), true],
    ["caller processing order", boolText(callerProcessingIssue === ""), true],
  ];
  const ok = rows.every(([, value, expected]) => {
    if (expected === undefined) {
      return value !== "missing";
    }
    return value === boolText(expected);
  });

  setStatus("producerStatus", ok ? "Verified" : "Check", ok);
  renderKeyValue(document.getElementById("producerProof"), rows);
}

function renderUnavailableProducerProof() {
  renderKeyValue(document.getElementById("producerProof"), [
    ["demo", "unavailable", "present"],
    ["runtime API", "unavailable", boolText(false)],
    ["scheduler", "unavailable", boolText(false)],
    ["audio engine", "unavailable", boolText(false)],
    ["phase measurements", "unavailable", boolText(true)],
    ["caller processing order", "unavailable", boolText(true)],
  ]);
}

function formatCircuitStep(step) {
  return `${step.sourceNode}.${step.sourcePort} -> ${step.destinationNode}.${step.destinationPort}`;
}

function renderCircuitChain(manifest) {
  const list = document.getElementById("circuitChain");
  const issue = callerProcessingOrderIssue(manifest);
  const order = manifest.callerProcessingOrder || {};
  const steps = Array.isArray(order.steps) ? order.steps : [];
  const ok = issue === "" && steps.length > 0;

  list.replaceChildren();
  for (const [index, step] of steps.entries()) {
    const circuitConnection = formatCircuitStep(step);
    const callerStep = String(step.callerStep || "missing");
    const rowOk = ok && Number(step.index) === index;
    const row = document.createElement("div");
    row.className = rowOk ? "chain-row" : "chain-row warn-row";
    row.dataset.chainIndex = String(index);
    row.dataset.circuitConnection = circuitConnection;
    row.dataset.callerStep = callerStep;
    row.dataset.chainState = rowOk ? "ok" : "check";
    row.setAttribute("role", "group");
    row.setAttribute(
      "aria-label",
      `Circuit connection ${index + 1}: ${circuitConnection}; caller step: ${callerStep}; ${row.dataset.chainState}`,
    );
    row.title = row.getAttribute("aria-label");

    const badge = document.createElement("strong");
    badge.className = "chain-index";
    badge.textContent = String(index + 1);

    const circuit = document.createElement("div");
    circuit.className = "chain-cell";
    const circuitLabel = document.createElement("span");
    circuitLabel.textContent = "Circuit connection";
    const circuitText = document.createElement("strong");
    circuitText.textContent = circuitConnection;
    circuit.append(circuitLabel, circuitText);

    const caller = document.createElement("div");
    caller.className = "chain-cell";
    const callerLabel = document.createElement("span");
    callerLabel.textContent = "Caller processing step";
    const callerText = document.createElement("strong");
    callerText.textContent = callerStep;
    caller.append(callerLabel, callerText);

    row.append(badge, circuit, caller);
    list.append(row);
  }

  if (!steps.length) {
    const row = document.createElement("div");
    row.className = "chain-row warn-row";
    row.dataset.chainIndex = "none";
    row.dataset.circuitConnection = "unavailable";
    row.dataset.callerStep = "unavailable";
    row.dataset.chainState = "check";
    row.setAttribute("role", "group");
    row.setAttribute("aria-label", "Circuit chain unavailable");
    row.title = nodeGraphTooltipText("legacyEvidence.circuitChainUnavailable");
    row.textContent = issue || "circuit chain unavailable";
    list.append(row);
  }

  setStatus("circuitChainStatus", ok ? "Aligned" : "Check", ok);
}

function renderUnavailableCircuitChain() {
  const list = document.getElementById("circuitChain");
  list.replaceChildren();
  const row = document.createElement("div");
  row.className = "chain-row warn-row";
  row.dataset.chainIndex = "none";
  row.dataset.circuitConnection = "unavailable";
  row.dataset.callerStep = "unavailable";
  row.dataset.chainState = "unavailable";
  row.setAttribute("role", "group");
  row.setAttribute("aria-label", "Circuit chain unavailable");
  row.title = nodeGraphTooltipText("legacyEvidence.circuitChainUnavailable");
  row.textContent = "manifest required";
  list.append(row);
}

function renderSandboxContract(manifest) {
  const list = document.getElementById("sandboxContract");
  const handoff = manifest.sandboxHandoff || {};
  const rows = [
    ["allowed", "display manifest artifacts", Boolean(handoff.entryPoint)],
    ["allowed", "play browser-native WAV", Boolean(handoff.primaryAudioArtifact)],
    ["allowed", "inspect decoded WAV data", handoff.inspectionMode === expectedInspectionMode],
    ["forbidden", "own DSP objects", handoff.circuitOwnsDspObjects === false],
    ["forbidden", "make DSP know Circuit", handoff.dspObjectsKnowCircuit === false],
    ["forbidden", "own scheduler", handoff.ownsScheduler === false],
    ["forbidden", "own audio engine", handoff.ownsAudioEngine === false],
    ["forbidden", "serialize patches", handoff.serializesPatch === false],
    ["required", "caller owns processing order", handoff.callerOwnsProcessingOrder === true],
  ];
  const ok = rows.every(([_kind, _label, rowOk]) => rowOk);

  list.replaceChildren();
  for (const [kind, label, rowOk] of rows) {
    const item = document.createElement("div");
    item.className = rowOk ? "contract-row" : "contract-row warn-row";
    item.dataset.contractKind = kind;
    item.dataset.contractLabel = label;
    item.dataset.contractState = rowOk ? "ok" : "check";
    item.setAttribute("role", "group");
    item.setAttribute("aria-label", `${kind}: ${label} / ${item.dataset.contractState}`);
    item.title = nodeGraphTooltipText("legacyEvidence.contractRow", {
      kind,
      label,
      state: item.dataset.contractState,
    });

    const marker = document.createElement("strong");
    marker.textContent = rowOk ? kind : "check";

    const text = document.createElement("span");
    text.textContent = label;

    item.append(marker, text);
    list.append(item);
  }

  setStatus("sandboxContractStatus", ok ? "Bounded" : "Check", ok);
}

function renderUnavailableSandboxContract() {
  const list = document.getElementById("sandboxContract");
  const rows = [
    ["check", "sandbox handoff"],
    ["check", "read-only boundary"],
    ["check", "caller-owned processing order"],
  ];

  list.replaceChildren();
  for (const [kind, label] of rows) {
    const item = document.createElement("div");
    item.className = "contract-row warn-row";
    item.dataset.contractKind = kind;
    item.dataset.contractLabel = label;
    item.dataset.contractState = "unavailable";
    item.setAttribute("role", "group");
    item.setAttribute("aria-label", `${kind}: ${label} / unavailable`);
    item.title = nodeGraphTooltipText("legacyEvidence.contractRow", {
      kind,
      label,
      state: "unavailable",
    });

    const marker = document.createElement("strong");
    marker.textContent = kind;

    const text = document.createElement("span");
    text.textContent = label;

    item.append(marker, text);
    list.append(item);
  }
}

function renderUnavailableBoundaryFlags() {
  renderKeyValue(
    document.getElementById("boundaryFlags"),
    requiredFlags.map(([key, expected]) => [
      key,
      "unavailable",
      expected,
    ]),
  );
}
