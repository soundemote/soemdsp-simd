const requiredFlags = [
  ["callerOwnsProcessingOrder", true],
  ["callerOwnsDspObjects", true],
  ["circuitOwnsDspObjects", false],
  ["dspObjectsKnowCircuit", false],
  ["serializesPatch", false],
  ["ownsAudioEngine", false],
  ["ownsScheduler", false],
];

const expectedContract = "soemdsp-demo-local-sandbox-handoff";
const expectedContractVersion = 1;
const expectedInspectionMode = "mouse-and-ears";
const phaseAudioFrequencyToleranceHz = 0.5;
const phaseAudioAmplitudeTolerance = 0.001;
const phaseAudioRmsTolerance = 0.001;

const inspectionSources = Object.freeze({
  waveform: "waveform",
  scrubber: "scrubber",
  levelEnvelope: "level envelope",
  signalPlot: "signal plot",
  parameterTimeline: "parameter timeline",
  phaseAudioStats: "phase audio stats",
  phaseList: "phase list",
  phaseJump: "phase jump",
});

const inspectionModes = Object.freeze({
  none: "none",
  transport: "transport",
  hover: "hover",
  probe: "probe",
});

const statusStripLabels = Object.freeze({
  manifestStatus: "Manifest",
  contractStatus: "Contract",
  inspectionMode: "Mode",
  frameCount: "Frames",
  checklistStatus: "Checklist",
});

function artifactUrl(path) {
  return `/artifact?path=${encodeURIComponent(path)}`;
}

function artifactRowLabel(link) {
  return `${link.path ? "Open" : "Missing"} ${link.kind || "artifact"} artifact: ${
    link.label || link.path || "unknown"
  }`;
}

function clampFrame(frame, waveform) {
  return Math.max(0, Math.min(waveform.frames, frame));
}

function formatInspectionDelta(deltaFrame, sampleRate) {
  if (deltaFrame === null) {
    return "none";
  }

  const sign = deltaFrame >= 0 ? "+" : "";
  return `${sign}${deltaFrame} frames / ${sign}${formatSeconds(deltaFrame / sampleRate)}`;
}
