function phaseJumpButtonsLabeled(manifest) {
  const phases = Array.isArray(manifest?.phases) ? manifest.phases : [];
  const buttons = [...document.querySelectorAll("#waveformPhaseControls button")];
  if (!phases.length || buttons.length !== phases.length) {
    return false;
  }

  return buttons.every((button) => {
    const label = button.getAttribute("aria-label") || "";
    return (
      button.dataset.phaseIndex !== undefined &&
      button.dataset.phaseName !== undefined &&
      button.dataset.phaseStartFrame !== undefined &&
      button.dataset.phaseEndFrame !== undefined &&
      button.dataset.phaseStartTime !== undefined &&
      button.dataset.phaseEndTime !== undefined &&
      label.startsWith("Jump waveform to ") &&
      label.includes(" phase from frame ") &&
      label.includes(" to ") &&
      button.title.startsWith("Jump to ") &&
      button.title.includes(" from ") &&
      button.title.includes(" to ")
    );
  });
}

function waveformControlsLabeled() {
  return waveformControlButtonsLabeled(["waveformPlayButton", "followAudioButton"]);
}

function waveformPlayControlLabeled() {
  return waveformControlButtonsLabeled(["waveformPlayButton"]);
}

function followAudioControlLabeled() {
  return waveformControlButtonsLabeled(["followAudioButton"]);
}

function waveformControlButtonsLabeled(ids) {
  return ids.every((id) => {
    const button = document.getElementById(id);
    const label = button?.dataset.waveformControlLabel;
    const value = button?.dataset.waveformControlValue;
    const stateName = button?.dataset.waveformControlState;
    const ariaLabel = button?.getAttribute("aria-label") || "";
    const title = button?.title || "";
    return (
      Boolean(label) &&
      Boolean(value) &&
      Boolean(stateName) &&
      ariaLabel === `${label}: ${value}` &&
      title === `${label}: ${value} / ${stateName}` &&
      ["true", "false"].includes(button?.getAttribute("aria-pressed"))
    );
  });
}

function waveformScrubberLabeled() {
  const scrubber = document.getElementById("waveformScrubber");
  return (
    scrubber?.getAttribute("aria-label") === "Waveform position" &&
    Boolean(scrubber.getAttribute("aria-valuetext")) &&
    Boolean(scrubber.title) &&
    ["follow", "free"].includes(scrubber.dataset.followMode || "") &&
    scrubber.getAttribute("min") === "0" &&
    scrubber.getAttribute("max") === "1" &&
    scrubber.getAttribute("step") === "0.001"
  );
}

function waveformCanvasLabeled() {
  const canvas = document.getElementById("waveformCanvas");
  return (
    canvas?.getAttribute("aria-label") === "Primary WAV waveform" &&
    canvas.dataset.waveformSource === "decoded primary WAV" &&
    canvas.dataset.waveformSampleRate !== undefined &&
    canvas.dataset.waveformChannels !== undefined &&
    canvas.dataset.waveformBitDepth !== undefined &&
    canvas.dataset.waveformFrames !== undefined &&
    canvas.dataset.waveformDataBytes !== undefined &&
    canvas.dataset.waveformFileBytes !== undefined &&
    canvas.dataset.waveformPeak !== undefined &&
    canvas.dataset.waveformRms !== undefined &&
    Boolean(canvas.title)
  );
}

function levelEnvelopeCanvasLabeled() {
  const canvas = document.getElementById("levelEnvelopeCanvas");
  return (
    canvas?.getAttribute("aria-label") === "Primary WAV level envelope" &&
    canvas.dataset.envelopeSource === "decoded primary WAV" &&
    canvas.dataset.envelopeWindowMs !== undefined &&
    canvas.dataset.envelopeWindowFrames !== undefined &&
    canvas.dataset.envelopeWindows !== undefined &&
    canvas.dataset.envelopePeak !== undefined &&
    canvas.dataset.envelopeRms !== undefined &&
    canvas.dataset.envelopeFrames !== undefined &&
    Boolean(canvas.title)
  );
}
