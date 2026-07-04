function probePillLabeled(id) {
  const probe = document.getElementById(id);
  return (
    Boolean(probe?.dataset.probeSource) &&
    Boolean(probe?.dataset.probeFrame) &&
    Boolean(probe?.title)
  );
}

function probePillsLabeled(ids) {
  return ids.every((id) => probePillLabeled(id));
}

function waveformProbeLabeled() {
  return probePillLabeled("waveformProbe");
}

function levelEnvelopeProbeLabeled() {
  return probePillLabeled("levelEnvelopeProbe");
}

function parameterTimelineProbeLabeled() {
  return probePillLabeled("parameterTimelineProbe");
}

function phaseAudioStatsProbeLabeled() {
  return probePillLabeled("phaseAudioStatsProbe");
}

function phaseListProbeLabeled() {
  return probePillLabeled("phaseProbe");
}

function signalPlotPointProbeLabeled() {
  return probePillLabeled("signalPlotProbe");
}

function signalPlotSourceProbeLabeled() {
  return probePillLabeled("signalPlotProbeSource");
}

function signalPlotProbeLabeled() {
  return probePillsLabeled(["signalPlotProbe", "signalPlotProbeSource"]);
}

function waveformToSignalProbeAvailable() {
  const probe = signalPlotProbeAtFrame(0);
  return (
    Boolean(probe) &&
    Number.isFinite(probe.x) &&
    Number.isFinite(probe.y) &&
    probe.nearest?.frame === 0 &&
    probe.nearest.distance === 0
  );
}

function signalToWaveformProbeAvailable() {
  return waveformProbeLabeled();
}

function circuitChainRowsLabeled() {
  const rows = [...document.querySelectorAll("#circuitChain .chain-row")];
  if (!rows.length) {
    return false;
  }
  return rows.every((row, index) => {
    const label = row.getAttribute("aria-label") || "";
    return (
      row.dataset.chainIndex === String(index) &&
      row.dataset.circuitConnection !== undefined &&
      row.dataset.callerStep !== undefined &&
      row.dataset.chainState === "ok" &&
      row.getAttribute("role") === "group" &&
      label.includes(row.dataset.circuitConnection) &&
      label.includes(row.dataset.callerStep) &&
      row.title === label
    );
  });
}
