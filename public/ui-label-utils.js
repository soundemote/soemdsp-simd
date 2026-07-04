function labelStatusStripValue(element, label, value, ok) {
  const valueText = String(value);
  const stateName = ok ? "ok" : "check";
  element.dataset.statusLabel = label;
  element.dataset.statusValue = valueText;
  element.dataset.statusState = stateName;
  element.setAttribute("role", "status");
  element.setAttribute("aria-label", `${label}: ${valueText}`);
  element.title = nodeGraphTooltipText("legacyEvidence.labeledState", {
    label,
    state: stateName,
    value: valueText,
  });
}

function setText(id, value) {
  const element = document.getElementById(id);
  element.textContent = value;
  if (statusStripLabels[id]) {
    const valueText = String(value);
    const ok =
      valueText !== "Loading" &&
      valueText !== "Unavailable" &&
      valueText !== "0";
    labelStatusStripValue(element, statusStripLabels[id], valueText, ok);
  }
}

function setSourceText(id, key, value, expected = "present", ok = true) {
  const element = document.getElementById(id);
  const valueText = String(value);
  const expectedText = String(expected);
  element.textContent = valueText;
  element.dataset.sourceKey = key;
  element.dataset.sourceValue = valueText;
  element.dataset.sourceExpected = expectedText;
  element.dataset.sourceState = ok ? "ok" : "check";
  element.setAttribute("aria-label", `${key}: ${valueText}`);
  element.title =
    expected === "none" || expected === "present"
      ? nodeGraphTooltipText("legacyEvidence.sourceValue", { key, value: valueText })
      : nodeGraphTooltipText("legacyEvidence.sourceValueExpected", {
        expected: expectedText,
        key,
        value: valueText,
      });
}

function clearElement(id) {
  document.getElementById(id).replaceChildren();
}

function setStatus(id, value, ok) {
  const element = document.getElementById(id);
  const isPill = element.classList.contains("pill");
  element.textContent = value;
  element.className = isPill ? `pill ${ok ? "good" : "warn"}` : ok ? "" : "warn";
  if (statusStripLabels[id]) {
    labelStatusStripValue(element, statusStripLabels[id], value, ok);
  }
}

function labelPrimaryAudio(path, ok) {
  const audio = document.getElementById("audioPlayer");
  const pathText = path || "unavailable";
  const displayText = path || "Render Sample preview audio";
  const stateName = ok ? "ok" : "check";
  audio.dataset.audioLabel = "Primary Audio";
  audio.dataset.audioPath = pathText;
  audio.dataset.audioState = stateName;
  audio.setAttribute("aria-label", `Sample preview: ${displayText}`);
  audio.title = nodeGraphTooltipText("legacyEvidence.samplePreview", {
    state: stateName,
    text: displayText,
  });
}

function labelPrimaryAudioTitle(path, ok) {
  const title = document.getElementById("audioTitle");
  const pathText = path || "unavailable";
  const displayText = path || "";
  const stateName = ok ? "ok" : "check";
  title.textContent = displayText;
  title.dataset.audioTitleLabel = "Primary Audio";
  title.dataset.audioTitlePath = pathText;
  title.dataset.audioTitleState = stateName;
  title.setAttribute("aria-label", `Sample preview title: ${displayText}`);
  title.title = nodeGraphTooltipText("legacyEvidence.samplePreviewTitle", {
    state: stateName,
    text: displayText,
  });
}

function labelWaveformHeaderPill(element, label, value, ok) {
  const valueText = String(value);
  const stateName = ok ? "ok" : "check";
  element.textContent = valueText;
  element.dataset.waveformHeaderLabel = label;
  element.dataset.waveformHeaderValue = valueText;
  element.dataset.waveformHeaderState = stateName;
  element.setAttribute("aria-label", `${label}: ${valueText}`);
  element.title = nodeGraphTooltipText("legacyEvidence.labeledState", {
    label,
    state: stateName,
    value: valueText,
  });
}

function labelWaveformControlButton(button, label, value, stateName) {
  const valueText = String(value);
  button.dataset.waveformControlLabel = label;
  button.dataset.waveformControlValue = valueText;
  button.dataset.waveformControlState = stateName;
  button.setAttribute("aria-label", `${label}: ${valueText}`);
  button.title = nodeGraphTooltipText("legacyEvidence.labeledState", {
    label,
    state: stateName,
    value: valueText,
  });
}

function labelInspectionCursorPill(element, label, value, stateName) {
  element.setAttribute("aria-label", `${label}: ${value}`);
  element.title = nodeGraphTooltipText("legacyEvidence.sourceValue", { key: label, value });
  element.dataset.inspectionPill = label;
  element.dataset.inspectionValue = value;
  element.dataset.inspectionState = stateName;
}

function labelInspectionCursorSurface(cursor, value, stateName) {
  cursor.dataset.inspectionCursorLabel = "inspection cursor";
  cursor.dataset.inspectionCursorValue = value;
  cursor.dataset.inspectionCursorState = stateName;
  cursor.setAttribute("role", "group");
  cursor.setAttribute("aria-label", `inspection cursor: ${value}`);
  cursor.title = nodeGraphTooltipText("legacyEvidence.inspectionCursor", {
    state: stateName,
    value,
  });
}

Object.assign(window, {
  clearElement,
  labelInspectionCursorPill,
  labelInspectionCursorSurface,
  labelPrimaryAudio,
  labelPrimaryAudioTitle,
  labelStatusStripValue,
  labelWaveformControlButton,
  labelWaveformHeaderPill,
  setSourceText,
  setStatus,
  setText,
});
