const nodeGraphExternalButtonEventNames = Object.freeze(["click", "hover", "down", "up", "enter", "leave"]);
const nodeGraphWireBreakGateSeconds = 0.52;
const nodeGraphWindowReopenGateSeconds = 1;
const nodeGraphGameTriggerDispatchDelayMs = 40;
const nodeGraphGameTriggerPulseSeconds = 0.02;
const nodeGraphExternalSandboxEventNames = Object.freeze(new Set([
  "shootingStarExplosion",
]));

// When embedded with ?autoframe=1, zoom-to-fit the whole patch after it loads.
function nodeGraphExternalAutoFrameRequested() {
  try {
    return new URLSearchParams(window.location.search).get("autoframe") === "1";
  } catch (error) {
    return false;
  }
}

// When embedded with ?autostart=1, turn Live Audio output on as soon as the
// sandbox interface is ready -- skips needing to press the output power
// button by hand for embeds that want sound playing immediately on load.
function nodeGraphExternalAutostartRequested() {
  try {
    const raw = String(new URLSearchParams(window.location.search).get("autostart") || "")
      .trim()
      .toLowerCase();
    return raw === "1" || raw === "true" || raw === "yes";
  } catch (error) {
    return false;
  }
}

function nodeGraphExternalStartLiveOutput() {
  if (typeof setNodeGraphLiveOutputEnabled !== "function") {
    return;
  }
  if (nodeGraphMvp?.live?.outputEnabled) {
    return;
  }
  setNodeGraphLiveOutputEnabled(true);
}

// Autostart Live Audio once the sandbox interface has finished booting (patch
// committed, DOM built) when embedded with ?autostart=1.
if (nodeGraphExternalAutostartRequested()) {
  if (document.documentElement.dataset.nodeSandboxInterfaceReady === "true") {
    nodeGraphExternalStartLiveOutput();
  } else {
    window.addEventListener("nodeSandboxInterfaceReady", () => nodeGraphExternalStartLiveOutput(), { once: true });
  }
}

// When embedded with ?hideui=1, drop all chrome: force modular-only view and
// hide the back button, resize handle, and workspace border for a clean,
// full-screen "no nonsense" frame. Handled via a root class + CSS.
function nodeGraphExternalHideUiRequested() {
  try {
    const raw = String(new URLSearchParams(window.location.search).get("hideui") || "")
      .trim()
      .toLowerCase();
    return raw === "1" || raw === "true" || raw === "yes";
  } catch (error) {
    return false;
  }
}

if (nodeGraphExternalHideUiRequested()) {
  document.documentElement.classList.add("soemdsp-hide-ui");
}

function nodeGraphExternalScheduleAutoFrame(options = {}) {
  if (typeof window.nodeGraphAutoFrame !== "function") {
    return;
  }
  // Two rAFs so node DOM has laid out (offsetWidth/height) before measuring.
  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(() => {
      window.nodeGraphAutoFrame(options);
    });
  });
}

function nodeGraphExternalAutoFrameAfterLoad(options = {}) {
  if (nodeGraphExternalAutoFrameRequested() || options.force) {
    nodeGraphExternalScheduleAutoFrame(options);
  }
}

function normalizeNodeGraphExternalButtonEventName(name) {
  const key = String(name || "").trim().toLowerCase();
  if (key === "mousedown" || key === "pointerdown") return "down";
  if (key === "mouseup" || key === "pointerup") return "up";
  if (key === "mouseenter" || key === "pointerenter") return "enter";
  if (key === "mouseleave" || key === "pointerleave") return "leave";
  return nodeGraphExternalButtonEventNames.includes(key) ? key : "";
}

function nodeGraphExternalButtonEventPulseSamples(sampleRate = nodeGraphMvp?.sampleRate || 44100) {
  return Math.max(1, Math.round(Math.max(1, Number(sampleRate) || 44100) * 0.02));
}

function setNodeGraphExternalButtonEventPulse(target, name, sampleRate) {
  const key = normalizeNodeGraphExternalButtonEventName(name);
  if (!key) return false;
  const map = target.externalButtonEvents instanceof Map
    ? target.externalButtonEvents
    : new Map();
  target.externalButtonEvents = map;
  map.set(key, Math.max(Number(map.get(key)) || 0, nodeGraphExternalButtonEventPulseSamples(sampleRate)));
  return true;
}

function sendNodeGraphLiveExternalButtonEvent(name, payload = {}) {
  const key = normalizeNodeGraphExternalButtonEventName(name);
  if (!key) return false;
  if (nodeGraphMvp.live.runtime) {
    setNodeGraphExternalButtonEventPulse(
      nodeGraphMvp.live.runtime,
      key,
      nodeGraphMvp.live.context?.sampleRate || nodeGraphMvp.sampleRate,
    );
  }
  if (nodeGraphMvp.live.usesWorklet && nodeGraphMvp.live.node?.port) {
    nodeGraphMvp.live.node.port.postMessage({
      name: key,
      payload,
      type: "externalButtonEvent",
    });
  }
  window.dispatchEvent(new CustomEvent("nodeGraphExternalButtonEvent", {
    detail: { name: key, payload },
  }));
  return true;
}

function triggerNodeGraphExternalButtonEvent(name, payload = {}) {
  return sendNodeGraphLiveExternalButtonEvent(name, payload);
}

function scheduleNodeGraphLiveGameTriggerEvent(send, reason = "") {
  if (typeof send !== "function") {
    return false;
  }
  const normalizedReason = String(reason || "").slice(0, 120);
  window.setTimeout(() => {
    send(normalizedReason);
  }, nodeGraphGameTriggerDispatchDelayMs);
  return true;
}

function nodeGraphGameTriggerPulseSamples(sampleRate = nodeGraphMvp?.sampleRate || 44100) {
  return Math.max(1, Math.round(Math.max(1, Number(sampleRate) || 44100) * nodeGraphGameTriggerPulseSeconds));
}

function nodeGraphWireBreakGateSamples(sampleRate = nodeGraphMvp?.sampleRate || 44100) {
  return Math.max(1, Math.round(Math.max(1, Number(sampleRate) || 44100) * nodeGraphWireBreakGateSeconds));
}

function setNodeGraphWireBreakEventPulse(target, sampleRate) {
  if (!target || typeof target !== "object") {
    return false;
  }
  const event = target.wireBreakEvent && typeof target.wireBreakEvent === "object"
    ? target.wireBreakEvent
    : { pulseSamples: 0, gateSamples: 0 };
  event.pulseSamples = Math.max(Number(event.pulseSamples) || 0, nodeGraphGameTriggerPulseSamples(sampleRate));
  event.gateSamples = Math.max(Number(event.gateSamples) || 0, nodeGraphWireBreakGateSamples(sampleRate));
  target.wireBreakEvent = event;
  return true;
}

function sendNodeGraphLiveWireBreakEvent(reason = "") {
  if (nodeGraphMvp.live.runtime) {
    setNodeGraphWireBreakEventPulse(
      nodeGraphMvp.live.runtime,
      nodeGraphMvp.live.context?.sampleRate || nodeGraphMvp.sampleRate,
    );
  }
  if (nodeGraphMvp.live.usesWorklet && nodeGraphMvp.live.node?.port) {
    nodeGraphMvp.live.node.port.postMessage({
      reason: String(reason || "").slice(0, 120),
      type: "wireBreakEvent",
    });
  }
  window.dispatchEvent(new CustomEvent("nodeGraphWireBreakEvent", {
    detail: { reason: String(reason || "") },
  }));
  return true;
}

function triggerNodeGraphWireBreakEvent(reason = "") {
  return scheduleNodeGraphLiveGameTriggerEvent(sendNodeGraphLiveWireBreakEvent, reason);
}

// "Trigger patches" quick-connect a small reusable circuit (see
// public/node-graph-trigger-patch-library.js) into a target input port --
// a standing binding, not a one-shot poke like triggerNodeGraphManualImpulseEvent
// above. The sourcePatch is compiled to a plan (nodeGraphBuildLivePlanForPatch)
// and its Gate/Out node ids resolved (nodeGraphModuleGroupInterfaceFromPatch)
// *here*, on the main thread, before anything crosses into the worklet --
// the worklet's isolated AudioWorkletGlobalScope never loads
// node-graph-trigger-patch-library.js or node-graph-parameter-metadata.js,
// same reason dsf_oscillator/robin_supersaw inline their own JS fallbacks
// instead of sharing globals across that boundary. Realtime worklet path
// only for now, matching manualImpulseEvent's own scope -- offline/export
// parity is a deliberate follow-up, not part of this first pass.
function triggerNodeGraphPatchBind(nodeId, port, triggerId, sourcePatchEntry) {
  if (!nodeId || !port || !triggerId) {
    return false;
  }
  if (!(nodeGraphMvp.live.usesWorklet && nodeGraphMvp.live.node?.port)) {
    return false;
  }
  const entry = sourcePatchEntry || (
    typeof nodeGraphTriggerPatchById === "function" ? nodeGraphTriggerPatchById(triggerId) : null
  );
  if (!entry) {
    return false;
  }
  const kind = entry.kind || "sourcePatch";
  let plan = null;
  let gateNodeId = null;
  let outNodeId = null;
  if (kind !== "stepImpulse" && entry.sourcePatch) {
    const interfaceInfo = nodeGraphModuleGroupInterfaceFromPatch(entry.sourcePatch);
    plan = nodeGraphBuildLivePlanForPatch(entry.sourcePatch);
    gateNodeId = interfaceInfo.inputs[0]?.nodeId || null;
    outNodeId = interfaceInfo.outputs[0]?.nodeId || null;
  }
  nodeGraphMvp.live.node.port.postMessage({
    type: "triggerPatchBind",
    nodeId: String(nodeId),
    port: String(port),
    triggerId: String(triggerId),
    kind,
    plan,
    gateNodeId,
    outNodeId,
  });
  return true;
}

function triggerNodeGraphPatchUnbind(nodeId, port) {
  if (!nodeId || !port) {
    return false;
  }
  if (nodeGraphMvp.live.usesWorklet && nodeGraphMvp.live.node?.port) {
    nodeGraphMvp.live.node.port.postMessage({
      type: "triggerPatchUnbind",
      nodeId: String(nodeId),
      port: String(port),
    });
    return true;
  }
  return false;
}

function triggerNodeGraphPatchStart(nodeId, port) {
  if (!nodeId || !port) {
    return false;
  }
  if (nodeGraphMvp.live.usesWorklet && nodeGraphMvp.live.node?.port) {
    nodeGraphMvp.live.node.port.postMessage({
      type: "triggerPatchStart",
      nodeId: String(nodeId),
      port: String(port),
    });
    return true;
  }
  return false;
}

function triggerNodeGraphPatchStop(nodeId, port) {
  if (!nodeId || !port) {
    return false;
  }
  if (nodeGraphMvp.live.usesWorklet && nodeGraphMvp.live.node?.port) {
    nodeGraphMvp.live.node.port.postMessage({
      type: "triggerPatchStop",
      nodeId: String(nodeId),
      port: String(port),
    });
    return true;
  }
  return false;
}

function triggerNodeGraphPatchFire(nodeId, port) {
  if (!nodeId || !port) {
    return false;
  }
  if (nodeGraphMvp.live.usesWorklet && nodeGraphMvp.live.node?.port) {
    nodeGraphMvp.live.node.port.postMessage({
      type: "triggerPatchFire",
      nodeId: String(nodeId),
      port: String(port),
    });
    return true;
  }
  return false;
}

// Double-clicking an input port's hitbox sends a single-sample 1.0 pulse
// into that input -- a manual "poke" for self-oscillating filters that need
// a transient to wake up (e.g. Flower Child at high resonance, now that its
// noise floor is gone) without wiring in a whole separate impulse module.
// This is just the "oneSampleImpulse" trigger patch, bound (idempotently --
// rebinding is harmless, that circuit has no state worth preserving across
// presses) and fired every double-click; it's never explicitly unbound, so
// the port stays quick-connected and later double-clicks are instant.
// Collapses what used to be a separate manualImpulses fast-path into the
// same mechanism trigger patches use, rather than two parallel systems for
// "sum something extra into this port." Realtime worklet path only --
// there's no live audio thread to poke during an offline render.
function triggerNodeGraphQuickImpulse(nodeId, port) {
  if (!nodeId || !port) {
    return false;
  }
  if (!triggerNodeGraphPatchBind(nodeId, port, "oneSampleImpulse")) {
    return false;
  }
  return triggerNodeGraphPatchFire(nodeId, port);
}

// The app metronome: a always-available click synced to the patch's own
// tempo (nodeGraphMvp.patch.timing -- the same BPM/time-signature the
// Command Center's tap-tempo panel edits), with two "circuit slots" -- the
// sound each beat/downbeat makes is itself a bound trigger patch, under
// synthetic keys ("__metronome__", "beat"/"downbeat") rather than a real
// graph node/port. Same bind mechanism as quick-connect; the metronome is
// just another consumer of "sum a bound circuit's output in somewhere."
// Defaults both slots to the plain 1-sample impulse so turning the
// metronome on does something audible before any slot is customized.
function triggerNodeGraphSetMetronomeCircuit(slot, triggerId) {
  if (slot !== "beat" && slot !== "downbeat") {
    return false;
  }
  return triggerNodeGraphPatchBind("__metronome__", slot, triggerId || "oneSampleImpulse");
}

function triggerNodeGraphSetMetronomeEnabled(enabled) {
  const on = Boolean(enabled);
  if (on) {
    if (!triggerNodeGraphSetMetronomeCircuit("beat", "oneSampleImpulse")) {
      return false;
    }
    triggerNodeGraphSetMetronomeCircuit("downbeat", "oneSampleImpulse");
  }
  if (nodeGraphMvp.live.usesWorklet && nodeGraphMvp.live.node?.port) {
    nodeGraphMvp.live.node.port.postMessage({ type: "setMetronomeEnabled", enabled: on });
    return true;
  }
  return false;
}

// Temporary console-callable API surface until real UI exists for this.
window.soemdspSandboxBindTriggerPatch = triggerNodeGraphPatchBind;
window.soemdspSandboxUnbindTriggerPatch = triggerNodeGraphPatchUnbind;
window.soemdspSandboxStartTriggerPatch = triggerNodeGraphPatchStart;
window.soemdspSandboxStopTriggerPatch = triggerNodeGraphPatchStop;
window.soemdspSandboxFireTriggerPatch = triggerNodeGraphPatchFire;
window.soemdspSandboxQuickImpulse = triggerNodeGraphQuickImpulse;
window.soemdspSandboxSetMetronomeEnabled = triggerNodeGraphSetMetronomeEnabled;
window.soemdspSandboxSetMetronomeCircuit = triggerNodeGraphSetMetronomeCircuit;

function setNodeGraphWireConnectEventPulse(target, sampleRate) {
  if (!target || typeof target !== "object") {
    return false;
  }
  const event = target.wireConnectEvent && typeof target.wireConnectEvent === "object"
    ? target.wireConnectEvent
    : { pulseSamples: 0 };
  event.pulseSamples = Math.max(Number(event.pulseSamples) || 0, nodeGraphGameTriggerPulseSamples(sampleRate));
  target.wireConnectEvent = event;
  return true;
}

function sendNodeGraphLiveWireConnectEvent(reason = "") {
  if (nodeGraphMvp.live.runtime) {
    setNodeGraphWireConnectEventPulse(
      nodeGraphMvp.live.runtime,
      nodeGraphMvp.live.context?.sampleRate || nodeGraphMvp.sampleRate,
    );
  }
  if (nodeGraphMvp.live.usesWorklet && nodeGraphMvp.live.node?.port) {
    nodeGraphMvp.live.node.port.postMessage({
      reason: String(reason || "").slice(0, 120),
      type: "wireConnectEvent",
    });
  }
  window.dispatchEvent(new CustomEvent("nodeGraphWireConnectEvent", {
    detail: { reason: String(reason || "") },
  }));
  return true;
}

function triggerNodeGraphWireConnectEvent(reason = "") {
  return scheduleNodeGraphLiveGameTriggerEvent(sendNodeGraphLiveWireConnectEvent, reason);
}

function setNodeGraphWireDisconnectEventPulse(target, sampleRate) {
  if (!target || typeof target !== "object") {
    return false;
  }
  const event = target.wireDisconnectEvent && typeof target.wireDisconnectEvent === "object"
    ? target.wireDisconnectEvent
    : { pulseSamples: 0 };
  event.pulseSamples = Math.max(Number(event.pulseSamples) || 0, nodeGraphGameTriggerPulseSamples(sampleRate));
  target.wireDisconnectEvent = event;
  return true;
}

function sendNodeGraphLiveWireDisconnectEvent(reason = "") {
  if (nodeGraphMvp.live.runtime) {
    setNodeGraphWireDisconnectEventPulse(
      nodeGraphMvp.live.runtime,
      nodeGraphMvp.live.context?.sampleRate || nodeGraphMvp.sampleRate,
    );
  }
  if (nodeGraphMvp.live.usesWorklet && nodeGraphMvp.live.node?.port) {
    nodeGraphMvp.live.node.port.postMessage({
      reason: String(reason || "").slice(0, 120),
      type: "wireDisconnectEvent",
    });
  }
  window.dispatchEvent(new CustomEvent("nodeGraphWireDisconnectEvent", {
    detail: { reason: String(reason || "") },
  }));
  return true;
}

function triggerNodeGraphWireDisconnectEvent(reason = "") {
  return scheduleNodeGraphLiveGameTriggerEvent(sendNodeGraphLiveWireDisconnectEvent, reason);
}

function nodeGraphShootingStarExplosionEventSpeed(payload) {
  const speed = Number(payload?.speed);
  return Number.isFinite(speed) ? speed : null;
}

function setNodeGraphShootingStarExplosionEventPulse(target, sampleRate, speed = null) {
  if (!target || typeof target !== "object") {
    return false;
  }
  const event = target.shootingStarExplosionEvent && typeof target.shootingStarExplosionEvent === "object"
    ? target.shootingStarExplosionEvent
    : { pulseSamples: 0, speed: null };
  event.pulseSamples = Math.max(0, Number(event.pulseSamples) || 0) + 1;
  event.speed = Number.isFinite(Number(speed)) ? Number(speed) : null;
  target.shootingStarExplosionEvent = event;
  return true;
}

function sendNodeGraphLiveShootingStarExplosionEvent(payload = {}) {
  const eventPayload = payload && typeof payload === "object" ? payload : {};
  const speed = nodeGraphShootingStarExplosionEventSpeed(eventPayload);
  if (nodeGraphMvp.live.runtime) {
    setNodeGraphShootingStarExplosionEventPulse(
      nodeGraphMvp.live.runtime,
      nodeGraphMvp.live.context?.sampleRate || nodeGraphMvp.sampleRate,
      speed,
    );
  }
  if (nodeGraphMvp.live.usesWorklet && nodeGraphMvp.live.node?.port) {
    nodeGraphMvp.live.node.port.postMessage({
      payload: eventPayload,
      speed,
      type: "shootingStarExplosionEvent",
    });
  }
  window.dispatchEvent(new CustomEvent("nodeGraphShootingStarExplosionEvent", {
    detail: { payload: eventPayload },
  }));
  return true;
}

function triggerNodeGraphShootingStarExplosionEvent(payload = {}) {
  return sendNodeGraphLiveShootingStarExplosionEvent(payload);
}

function triggerNodeGraphGameEvent(name, payload = {}) {
  const eventName = String(name || "").trim();
  if (eventName === "shootingStarExplosion") {
    return triggerNodeGraphShootingStarExplosionEvent(payload);
  }
  return false;
}

function nodeGraphExternalMessageOriginAllowed(event) {
  if (!event || !event.origin) {
    return true;
  }
  return event.origin === window.location.origin;
}

function nodeGraphWindowReopenGateSamples(sampleRate = nodeGraphMvp?.sampleRate || 44100) {
  return Math.max(1, Math.round(Math.max(1, Number(sampleRate) || 44100) * nodeGraphWindowReopenGateSeconds));
}

function setNodeGraphWindowReopenEventPulse(target, sampleRate) {
  if (!target || typeof target !== "object") {
    return false;
  }
  const samples = nodeGraphWindowReopenGateSamples(sampleRate);
  target.windowReopenEvent = {
    gateSamples: samples,
    pulseSamples: nodeGraphGameTriggerPulseSamples(sampleRate),
    totalSamples: samples,
  };
  return true;
}

function sendNodeGraphLiveWindowReopenEvent(reason = "") {
  if (nodeGraphMvp.live.runtime) {
    setNodeGraphWindowReopenEventPulse(
      nodeGraphMvp.live.runtime,
      nodeGraphMvp.live.context?.sampleRate || nodeGraphMvp.sampleRate,
    );
  }
  if (nodeGraphMvp.live.usesWorklet && nodeGraphMvp.live.node?.port) {
    nodeGraphMvp.live.node.port.postMessage({
      reason: String(reason || "").slice(0, 120),
      type: "windowReopenEvent",
    });
  }
  window.dispatchEvent(new CustomEvent("nodeGraphWindowReopenEvent", {
    detail: { reason: String(reason || "") },
  }));
  return true;
}

function triggerNodeGraphWindowReopenEvent(reason = "") {
  return scheduleNodeGraphLiveGameTriggerEvent(sendNodeGraphLiveWindowReopenEvent, reason);
}

window.soemdspSandboxTriggerButtonEvent = triggerNodeGraphExternalButtonEvent;
window.soemdspSandboxTriggerWireBreakEvent = triggerNodeGraphWireBreakEvent;
window.soemdspSandboxTriggerWireConnectEvent = triggerNodeGraphWireConnectEvent;
window.soemdspSandboxTriggerWireDisconnectEvent = triggerNodeGraphWireDisconnectEvent;
window.soemdspSandboxTriggerWindowReopenEvent = triggerNodeGraphWindowReopenEvent;
window.soemdspSandboxTriggerGameEvent = triggerNodeGraphGameEvent;
window.soemdspSandboxTriggerShootingStarExplosionEvent = triggerNodeGraphShootingStarExplosionEvent;

const soemdspHeroEventNames = Object.freeze(new Set(["spawnShootingStar", "setRate"]));

function soemdspSandboxEmitHeroEvent(event, payload = {}) {
  const eventName = String(event || "").trim();
  if (!soemdspHeroEventNames.has(eventName)) return false;
  const parentWindow = window.parent;
  if (!parentWindow || parentWindow === window) return false;
  try {
    parentWindow.postMessage(
      { type: "soundemote:hero-event", event: eventName, payload: payload || {} },
      window.location.origin,
    );
    return true;
  } catch (error) {
    return false;
  }
}

function soemdspSandboxSpawnShootingStar(payload = {}) {
  return soemdspSandboxEmitHeroEvent("spawnShootingStar", payload);
}

function soemdspSandboxSetShootingStarRate(intervalSeconds, payload = {}) {
  return soemdspSandboxEmitHeroEvent("setRate", { ...payload, intervalSeconds });
}

window.soemdspSandboxEmitHeroEvent = soemdspSandboxEmitHeroEvent;
window.soemdspSandboxSpawnShootingStar = soemdspSandboxSpawnShootingStar;
window.soemdspSandboxSetShootingStarRate = soemdspSandboxSetShootingStarRate;

function nodeGraphAcceptFileGridSelection(rows, options = {}) {
  const list = Array.isArray(rows) ? rows : [rows].filter(Boolean);
  const normalizedResources = list
    .map((row) => typeof normalizeNodeGraphFileGridResourceRow === "function"
      ? normalizeNodeGraphFileGridResourceRow(row)
      : null)
    .filter(Boolean);
  if (typeof registerNodeGraphResources === "function") {
    registerNodeGraphResources(normalizedResources);
  }
  nodeGraphMvp.pendingFileGridResources = normalizedResources;
  const audioResource = normalizedResources.find((resource) => resource.kind === "audio") || null;
  const targetNodeId = typeof nodeGraphAudioPlayerTargetNodeId === "function"
    ? nodeGraphAudioPlayerTargetNodeId(options)
    : "";
  if (audioResource && targetNodeId && typeof nodeGraphSetAudioPlayerResource === "function") {
    const result = nodeGraphSetAudioPlayerResource(targetNodeId, audioResource, {
      record: options.record !== false,
    });
    if (result.ok) {
      setNodeInteractionHelp(`File Grid audio assigned to ${targetNodeId}`);
    } else {
      setNodeInteractionHelp(result.reason || "File Grid audio could not be assigned");
    }
    return {
      ...result,
      resources: normalizedResources,
      targetNodeId,
    };
  }
  const message = audioResource
    ? "File Grid audio registered; select a Music Player to bind it"
    : `File Grid resources registered (${normalizedResources.length})`;
  setNodeInteractionHelp(message);
  return {
    ok: true,
    resources: normalizedResources,
    targetNodeId,
  };
}

window.nodeGraphAcceptFileGridSelection = nodeGraphAcceptFileGridSelection;
window.soemdspSandboxAcceptFileGridSelection = nodeGraphAcceptFileGridSelection;

window.addEventListener("message", (event) => {
  const message = event.data && typeof event.data === "object" ? event.data : null;
  if (!message) {
    return;
  }
  if (message.type === "soemdsp-sandbox-button-event") {
    triggerNodeGraphExternalButtonEvent(message.name || message.event, {
      buttonId: message.buttonId || "",
      label: message.label || "",
      source: message.source || "external-page",
    });
  } else if (message.type === "soemdsp-sandbox-file-grid-selection") {
    nodeGraphAcceptFileGridSelection(message.rows || message.resources || message.resource || message.row, {
      audioPlayerNodeId: message.audioPlayerNodeId || "",
      nodeId: message.nodeId || "",
      record: message.record !== false,
      source: message.source || "file-grid",
      targetNodeId: message.targetNodeId || "",
    });
  } else if (message.type === "soundemote:sandbox-load-resource") {
    if (!nodeGraphExternalMessageOriginAllowed(event)) {
      return;
    }
    const envelope = message.resourceData || message.payload || message.resourceEnvelope || message;
    const resourceRows = envelope?.kind === "sandbox_resource"
      ? envelope.resource
      : (message.rows || message.resources || message.resource || message.row);
    nodeGraphAcceptFileGridSelection(resourceRows, {
      audioPlayerNodeId: message.audioPlayerNodeId || "",
      nodeId: message.nodeId || "",
      record: message.record !== false,
      source: message.source || envelope?.source || "soundemote-file-grid",
      targetNodeId: message.targetNodeId || "",
    });
  } else if (message.type === "soundemote:sandbox-event") {
    if (!nodeGraphExternalMessageOriginAllowed(event)) {
      return;
    }
    const eventName = String(message.event || "").trim();
    if (!nodeGraphExternalSandboxEventNames.has(eventName)) {
      return;
    }
    triggerNodeGraphGameEvent(eventName, message.payload || {});
  } else if (message.type === "soundemote:sandbox-project-data") {
    try {
      if (typeof nodeGraphPatchFromShareProjectData === "function") {
        const loadedPatch = nodeGraphPatchFromShareProjectData(message.projectData);
        const clonedPatch =
          typeof cloneNodeGraphPatch === "function"
            ? cloneNodeGraphPatch(loadedPatch)
            : loadedPatch;
        commitNodeGraphPatch(clonedPatch, { status: "shared patch loaded" });
        // Flag that an external patch was applied so the boot sequence's own
        // startup-patch commit (which can still be in flight -- it awaits an
        // async default-preset fetch) doesn't unconditionally overwrite it
        // if this message arrives mid-boot.
        nodeGraphMvp.externalStartupPatchApplied = true;
        nodeGraphExternalAutoFrameAfterLoad();
      }
    } catch (error) {
      if (typeof setNodeGraphScriptStatus === "function") {
        setNodeGraphScriptStatus(`shared patch load failed: ${error?.message || error}`, false);
      }
    }
  } else if (message.type === "soundemote:autoframe") {
    nodeGraphExternalScheduleAutoFrame(
      message.padding != null ? { padding: message.padding, force: true } : { force: true },
    );
  } else if (message.type === "soundemote:request-current-patch") {
    let projectData = null;
    try {
      if (typeof nodeGraphShareProjectData === "function") {
        projectData = nodeGraphShareProjectData();
      }
    } catch (error) {
      projectData = null;
    }
    event.source?.postMessage(
      {
        type: "soundemote:current-patch",
        requestId: message.requestId || null,
        projectData,
      },
      event.origin,
    );
  }
});

// Autoframe the initial patch on load when embedded with ?autoframe=1.
if (nodeGraphExternalAutoFrameRequested()) {
  if (document.readyState === "complete") {
    nodeGraphExternalScheduleAutoFrame();
  } else {
    window.addEventListener("load", () => nodeGraphExternalScheduleAutoFrame(), { once: true });
  }
}
