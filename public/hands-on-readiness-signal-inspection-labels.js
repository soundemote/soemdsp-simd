function signalPlotControlsLabeled() {
  const groups = [...document.querySelectorAll("#signalPlotControls .control-group")];
  const buttons = [...document.querySelectorAll("#signalPlotControls button")];
  return (
    groups.length === 7 &&
    groups.every((group) => (group.getAttribute("aria-label") || "").startsWith("Signal plot ")) &&
    buttons.length > 0 &&
    buttons.every((button) => {
      const label = button.getAttribute("aria-label") || "";
      return (
        label.startsWith("Signal plot ") &&
        button.title === label &&
        ["true", "false"].includes(button.getAttribute("aria-pressed"))
      );
    })
  );
}

function signalPlotCanvasLabeled() {
  const canvas = document.getElementById("signalPlotCanvas");
  return (
    canvas?.getAttribute("aria-label") === "Primary WAV signal plot" &&
    canvas.dataset.signalSource === "decoded primary WAV" &&
    canvas.dataset.signalFocus !== undefined &&
    canvas.dataset.signalMode !== undefined &&
    canvas.dataset.signalScale !== undefined &&
    canvas.dataset.signalWindow !== undefined &&
    canvas.dataset.signalWindowMs !== undefined &&
    canvas.dataset.signalLagMs !== undefined &&
    canvas.dataset.signalLagFrames !== undefined &&
    canvas.dataset.signalPoints !== undefined &&
    canvas.dataset.signalFocusPeak !== undefined &&
    canvas.dataset.signalFocusRms !== undefined &&
    Boolean(canvas.title)
  );
}

const inspectionCursorPillIds = [
  "inspectionCursorSource",
  "inspectionCursorDelta",
  "inspectionCursorAudio",
  "inspectionCursorPlayback",
  "inspectionCursorView",
  "inspectionCursorPreview",
  "inspectionCursorSeek",
  "inspectionCursorSeekTarget",
  "inspectionCursorSeekSync",
  "inspectionCursorTransport",
  "inspectionCursorTarget",
  "inspectionCursorDivergence",
];

function inspectionCursorPillLabeled(id) {
  const pill = document.getElementById(id);
  return (
    pill &&
    pill.dataset.inspectionPill !== undefined &&
    pill.dataset.inspectionValue !== undefined &&
    pill.dataset.inspectionState !== undefined &&
    pill.getAttribute("aria-label")?.startsWith(`${pill.dataset.inspectionPill}: `) &&
    pill.title === pill.getAttribute("aria-label")
  );
}

function inspectionCursorPillsLabeled() {
  return inspectionCursorPillIds.every((id) => inspectionCursorPillLabeled(id));
}

function inspectionCursorKeyValueLabeled(key) {
  const values = [...document.querySelectorAll("#inspectionCursor dd")];
  const value = values.find((row) => row.dataset.kvKey === key);
  return (
    value &&
    value.dataset.kvValue !== undefined &&
    value.dataset.kvExpected !== undefined &&
    value.dataset.kvState === "ok" &&
    value.getAttribute("aria-label") === `${key}: ${value.dataset.kvValue}` &&
    value.title === value.getAttribute("aria-label")
  );
}

function inspectionCursorHoverDeltaLabeled() {
  return inspectionCursorKeyValueLabeled("hover delta");
}

function inspectionCursorLabeled() {
  const cursor = document.getElementById("inspectionCursor");
  const label = cursor?.getAttribute("aria-label") || "";
  return (
    cursor?.dataset.inspectionCursorLabel === "inspection cursor" &&
    Boolean(cursor.dataset.inspectionCursorValue) &&
    cursor.dataset.inspectionCursorState === "ok" &&
    cursor.getAttribute("role") === "group" &&
    label === `inspection cursor: ${cursor.dataset.inspectionCursorValue}` &&
    cursor.title === `${label} / ok` &&
    inspectionCursorKeyValueLabeled("transport frame") &&
    inspectionCursorKeyValueLabeled("hover signal")
  );
}
