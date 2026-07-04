function normalizeNodeUiDevColor(value, fallback = "#000000") {
  const color = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(color) ? color.toLowerCase() : fallback;
}

function nodeUiDevHexColorToRgbTriplet(value, fallback = "#ffffff") {
  const color = normalizeNodeUiDevColor(value, fallback);
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ].join(" ");
}

function normalizeNodeUiDevControlValue(definition, value) {
  if (definition.type === "boolean") {
    return value == null ? Boolean(definition.defaultValue) : Boolean(value);
  }
  if (definition.type === "color") {
    return normalizeNodeUiDevColor(value, definition.defaultValue);
  }
  if (definition.type === "select") {
    const text = String(value || "");
    return definition.options?.some((option) => option.value === text)
      ? text
      : definition.defaultValue;
  }
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return definition.defaultValue;
  }
  return Math.max(definition.min, Math.min(definition.max, numeric));
}

function nodeUiDevSelectOption(definition, value) {
  return definition.options?.find((option) => option.value === value)
    || definition.options?.find((option) => option.value === definition.defaultValue)
    || null;
}

function nodeUiDevSelectLabel(definition, value) {
  return nodeUiDevSelectOption(definition, value)?.label || String(value || "");
}

function nodeUiDevSelectCssValue(definition, value) {
  return nodeUiDevSelectOption(definition, value)?.css || String(value || "inherit");
}

function nodeUiDevExposeCheckboxId(key) {
  return `nodeUiDevExpose${key.charAt(0).toUpperCase()}${key.slice(1)}`;
}

function nodeUiDevControlLabel(definition) {
  const input = document.getElementById(definition.id);
  const row = input?.closest?.(".node-ui-dev-control, .node-ui-dev-color-control, .node-ui-dev-check");
  return row?.querySelector?.(":scope > span")?.textContent?.trim() || definition.key;
}

function nodeUiDevControlIsExposed(key) {
  return Boolean(document.getElementById(nodeUiDevExposeCheckboxId(key))?.checked);
}
