function reportControlsLabeled() {
  const buttons = [...document.querySelectorAll("#reportControls button")];
  return (
    buttons.length > 0 &&
    buttons.every((button) => {
      const label = button.getAttribute("aria-label") || "";
      return (
        button.dataset.reportIndex !== undefined &&
        button.dataset.reportKind !== undefined &&
        button.dataset.reportPath !== undefined &&
        label.startsWith("Show report ") &&
        button.title === label &&
        ["true", "false"].includes(button.getAttribute("aria-pressed"))
      );
    })
  );
}

function reportViewerLabeled() {
  const viewer = document.getElementById("reportViewer");
  const label = viewer?.getAttribute("aria-label") || "";
  return (
    viewer?.dataset.reportLabel &&
    viewer.dataset.reportKind &&
    viewer.dataset.reportPath !== undefined &&
    viewer.dataset.reportState === "ok" &&
    viewer.getAttribute("role") === "region" &&
    label === `Report viewer ${viewer.dataset.reportLabel}: ok` &&
    viewer.title ===
      `Report viewer ${viewer.dataset.reportLabel} / ${viewer.dataset.reportKind} / ${
        viewer.dataset.reportPath || "missing"
      } / ok`
  );
}

function statusStripItemsLabeled() {
  return Object.entries(statusStripLabels).every(([id, labelText]) => {
    const element = document.getElementById(id);
    const label = element?.getAttribute("aria-label") || "";
    return (
      element?.dataset.statusLabel === labelText &&
      Boolean(element.dataset.statusValue) &&
      element.dataset.statusState === "ok" &&
      element.getAttribute("role") === "status" &&
      label === `${labelText}: ${element.dataset.statusValue}` &&
      element.title === `${label} / ok`
    );
  });
}

function primaryAudioLabeled(manifest) {
  const audio = document.getElementById("audioPlayer");
  const path = manifest?.sandboxHandoff?.primaryAudioArtifact || "";
  return (
    Boolean(path) &&
    audio.dataset.audioLabel === "Primary Audio" &&
    audio.dataset.audioPath === path &&
    audio.dataset.audioState === "ok" &&
    audio.getAttribute("aria-label") === `Primary Audio: ${path}` &&
    audio.title === `Primary Audio: ${path} / ok` &&
    audio.getAttribute("src") === artifactUrl(path)
  );
}

function primaryAudioTitleLabeled(manifest) {
  const title = document.getElementById("audioTitle");
  const path = manifest?.sandboxHandoff?.primaryAudioArtifact || "";
  return (
    Boolean(path) &&
    title.dataset.audioTitleLabel === "Primary Audio" &&
    title.dataset.audioTitlePath === path &&
    title.dataset.audioTitleState === "ok" &&
    title.getAttribute("aria-label") === `Primary Audio title: ${path}` &&
    title.title === `Primary Audio title: ${path} / ok` &&
    title.textContent === path
  );
}

function primaryAudioPositionLabeled() {
  return waveformHeaderPillsLabeled(["audioPosition"]);
}

function reloadManifestControlLabeled() {
  const button = document.getElementById("refreshButton");
  if (!button) {
    return true;
  }
  const label = button?.getAttribute("aria-label") || "";
  return (
    button?.dataset.loading !== undefined &&
    ["true", "false"].includes(button.getAttribute("aria-busy")) &&
    ["true", "false"].includes(button.dataset.loading) &&
    ["Reload manifest", "Loading manifest"].includes(label) &&
    Boolean(button.title) &&
    (button.dataset.loading === "true"
      ? button.disabled && label === "Loading manifest"
      : !button.disabled && label === "Reload manifest")
  );
}

function waveformHeaderPillsLabeled(ids) {
  return ids.every((id) => {
    const pill = document.getElementById(id);
    const label = pill?.getAttribute("aria-label") || "";
    return (
      pill?.dataset.waveformHeaderLabel !== undefined &&
      pill.dataset.waveformHeaderValue !== undefined &&
      pill.dataset.waveformHeaderState === "ok" &&
      label === `${pill.dataset.waveformHeaderLabel}: ${pill.dataset.waveformHeaderValue}` &&
      pill.title === `${label} / ok`
    );
  });
}

function currentParameterPillsLabeled() {
  return (
    waveformHeaderPillsLabeled(["currentFrequency", "currentAmplitude", "currentParameterStatus"]) &&
    currentMeasuredAudioPillsLabeled()
  );
}

function currentMeasuredAudioPillsLabeled() {
  return waveformHeaderPillsLabeled([
    "currentMeasuredFrequency",
    "currentMeasuredPeak",
    "currentMeasuredFrequencyDelta",
    "currentMeasuredPeakDelta",
    "currentMeasuredStatus",
  ]);
}

function waveformTransportPillsLabeled() {
  return waveformHeaderPillsLabeled([
    "waveformPosition",
    "waveformSample",
    "waveformPhase",
    "waveformPhaseRange",
  ]);
}

function phaseJumpTargetLabeled() {
  return waveformHeaderPillsLabeled(["waveformPhaseJumpTarget"]);
}
