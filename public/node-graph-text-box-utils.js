function nodeGraphOneLineText(value) {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}

function nodeGraphTextBoxOneLineText(value) {
  return String(value ?? "").replace(/[\r\n]+/g, " ");
}

function normalizeNodeGraphTextBoxMode(value) {
  return String(value || "").toLowerCase() === "multiline" ? "multiline" : "singleLine";
}

function normalizeNodeGraphTextBoxHorizontalAlign(value) {
  const align = String(value || "").toLowerCase();
  return ["left", "center", "right"].includes(align) ? align : "center";
}

function normalizeNodeGraphTextBoxVerticalAlignPercent(value) {
  const numeric = Math.round(Number(value));
  if (Number.isFinite(numeric)) {
    return Math.max(0, Math.min(100, numeric));
  }
  const align = String(value || "").toLowerCase();
  if (align === "top") {
    return 0;
  }
  if (align === "bottom") {
    return 100;
  }
  return 50;
}

const nodeGraphTextBoxTextSizeLimits = Object.freeze({
  maxPercent: 1000,
  minPercent: 50,
  stepPercent: 10,
});

function normalizeNodeGraphTextBoxTextSizePercent(value) {
  const textSizePercent = Math.round(Number(value));
  return Number.isFinite(textSizePercent)
    ? Math.max(
      nodeGraphTextBoxTextSizeLimits.minPercent,
      Math.min(nodeGraphTextBoxTextSizeLimits.maxPercent, textSizePercent),
    )
    : 100;
}

function normalizeNodeGraphTextBoxLayout(layout = {}) {
  const source = layout && typeof layout === "object" ? layout : {};
  const textMode = normalizeNodeGraphTextBoxMode(source.textMode || source.mode);
  const text = textMode === "singleLine"
    ? nodeGraphTextBoxOneLineText(source.text)
    : String(source.text ?? "");
  return {
    horizontalAlign: normalizeNodeGraphTextBoxHorizontalAlign(source.horizontalAlign || source.textAlign),
    kind: "textBox",
    text,
    textSizePercent: normalizeNodeGraphTextBoxTextSizePercent(source.textSizePercent),
    textMode,
    verticalAlignPercent: normalizeNodeGraphTextBoxVerticalAlignPercent(
      source.verticalAlignPercent ?? source.verticalAlign,
    ),
  };
}
