function setNodeGraphLiveMeter(
  peak = 0,
  rms = 0,
  clipCount = 0,
  protectionMuteCount = 0,
  badNumberCount = 0,
  overrunCount = 0,
  maxBlockProcessMs = 0,
  maxBlockBudgetRatio = 0,
) {
  const meter = document.getElementById("nodeLiveMeter");
  if (!meter) {
    return;
  }
  const clipText = clipCount ? ` / ${nodeGraphOutputClipCountText(clipCount)}` : "";
  const protectionText = protectionMuteCount ? ` / protected ${protectionMuteCount}` : "";
  const badNumberText = badNumberCount ? ` / bad ${badNumberCount}` : "";
  const overrunText = overrunCount
    ? ` / over ${overrunCount} / ${maxBlockProcessMs.toFixed(2)}ms / ${(maxBlockBudgetRatio * 100).toFixed(0)}%`
    : "";
  meter.textContent = `live peak ${peak.toFixed(3)} / rms ${rms.toFixed(3)}${clipText}${protectionText}${badNumberText}${overrunText}`;
  meter.dataset.liveClips = String(clipCount);
  meter.dataset.liveProtectionMutes = String(protectionMuteCount);
  meter.dataset.liveBadNumbers = String(badNumberCount);
  meter.dataset.liveOverruns = String(overrunCount);
  meter.className = `pill ${clipCount || protectionMuteCount || badNumberCount || overrunCount ? "warn" : peak > 0.001 ? "good" : ""}`.trim();
}

function setNodeGraphLiveInputMeter(peak = 0, rms = 0) {
  const meter = document.getElementById("nodeLiveInputMeter");
  const safePeak = Number.isFinite(Number(peak)) ? Math.max(0, Math.min(1, Number(peak))) : 0;
  const safeRms = Number.isFinite(Number(rms)) ? Math.max(0, Math.min(1, Number(rms))) : 0;
  nodeGraphMvp.live.inputMeterPeak = safePeak;
  nodeGraphMvp.live.inputMeterRms = safeRms;
  if (!meter) {
    syncNodeGraphInputModuleLiveState();
    return;
  }
  meter.textContent = `input peak ${safePeak.toFixed(3)} / rms ${safeRms.toFixed(3)}`;
  meter.className = `pill ${safePeak > 0.001 ? "good" : ""}`.trim();
  syncNodeGraphInputModuleLiveState();
  updateNodeGraphLiveInputTestStatus();
}

function setNodeGraphLiveScheduleStatus(text, state = "") {
  const status = document.getElementById("nodeLiveRouteStatus");
  if (!status) {
    return;
  }
  status.textContent = text;
  status.className = `pill ${state}`.trim();
}

function setNodeGraphLiveInputStatus(state, message = "") {
  const status = document.getElementById("nodeLiveInputStatus");
  nodeGraphMvp.live.inputStatus = state;
  if (!status) {
    return;
  }
  const textByState = {
    blocked: "input blocked",
    connected: "input connected",
    off: "input off",
    requesting: "input asking",
    wired: "input wired",
    unwired: "input unwired",
  };
  const classByState = {
    blocked: "error",
    connected: "good",
    off: "",
    requesting: "warn",
    wired: "good",
    unwired: "warn",
  };
  status.textContent = textByState[state] || "input off";
  status.className = `pill ${classByState[state] || ""}`.trim();
  if (message) {
    status.title = message;
  } else {
    status.removeAttribute("title");
  }
  syncNodeGraphInputModuleLiveState();
  updateNodeGraphLiveInputTestStatus();
}

function nodeGraphLiveMicStatusText(state = nodeGraphMvp.live.micStatus) {
  switch (state) {
    case "armed":
      return "mic waits";
    case "blocked":
      return "mic blocked";
    case "connected":
      return "mic live";
    case "requesting":
      return "mic asking";
    default:
      return "mic off";
  }
}

function nodeGraphLivePermissionStatusText(state = nodeGraphMvp.live.inputPermissionStatus) {
  switch (state) {
    case "denied":
      return "mic blocked";
    case "granted":
      return "mic allowed";
    case "prompt":
      return "mic ask ready";
    case "unsupported":
      return "mic permission unknown";
    default:
      return "mic unknown";
  }
}
