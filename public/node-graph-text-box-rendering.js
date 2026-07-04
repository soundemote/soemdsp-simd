function createNodeGraphTextBoxBody(node) {
  const body = document.createElement("div");
  body.className = "node-text-box-body";
  body.dataset.node = node;
  return body;
}

function syncNodeGraphTextBoxContentAlignment(field, layout = normalizeNodeGraphTextBoxLayout()) {
  if (!field) {
    return;
  }
  field.style.setProperty("--node-text-box-content-offset", "0px");
  const style = window.getComputedStyle(field);
  const fontSize = Number.parseFloat(style.fontSize) || 14;
  const lineHeight = Number.parseFloat(style.lineHeight) || fontSize * 1.2;
  const paddingTop = Number.parseFloat(style.paddingTop) || 0;
  const paddingBottom = Number.parseFloat(style.paddingBottom) || 0;
  const text = String(field.value || "");
  const lineCount = layout.textMode === "multiline"
    ? Math.max(1, text.split(/\r\n|\r|\n/).length)
    : 1;
  const contentHeight = lineCount * lineHeight;
  const availableHeight = Math.max(0, field.clientHeight - paddingTop - paddingBottom);
  const remainingHeight = Math.max(0, availableHeight - contentHeight);
  const offset = remainingHeight * normalizeNodeGraphTextBoxVerticalAlignPercent(layout.verticalAlignPercent) / 100;
  field.style.setProperty("--node-text-box-content-offset", `${offset.toFixed(2)}px`);
}

function nodeGraphTextBoxWidthFitScale(field, layout = normalizeNodeGraphTextBoxLayout()) {
  if (!field) {
    return 1;
  }
  if (layout.textMode === "singleLine") {
    return 1;
  }
  const style = window.getComputedStyle(field);
  const paddingLeft = Number.parseFloat(style.paddingLeft) || 0;
  const paddingRight = Number.parseFloat(style.paddingRight) || 0;
  const availableWidth = Math.max(1, field.clientWidth - paddingLeft - paddingRight);
  const text = String(field.value || "");
  const lines = text.split(/\r\n|\r|\n/);
  const measuredText = layout.textMode === "multiline"
    ? lines.flatMap((line) => line.trim().split(/\s+/).filter(Boolean))
    : lines;
  const samples = measuredText.length ? measuredText : [text || " "];
  const canvas = nodeGraphTextBoxWidthFitScale.canvas ||= document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    return 1;
  }
  context.font = style.font;
  const maxWidth = samples.reduce((width, sample) =>
    Math.max(width, context.measureText(sample || " ").width), 0);
  return maxWidth > availableWidth
    ? Math.max(0.4, availableWidth / maxWidth)
    : 1;
}

function syncNodeGraphTextBoxVisualFit(field, layout = normalizeNodeGraphTextBoxLayout()) {
  if (!field) {
    return;
  }
  field.scrollLeft = 0;
  field.scrollTop = 0;
  field.style.setProperty("--node-text-box-font-fit-scale", "1");
  field.style.setProperty(
    "--node-text-box-font-fit-scale",
    String(nodeGraphTextBoxWidthFitScale(field, layout)),
  );
  syncNodeGraphTextBoxContentAlignment(field, layout);
}

const nodeGraphTextBoxFitLayouts = new WeakMap();
let nodeGraphTextBoxResizeObserver = null;

function scheduleNodeGraphTextBoxVisualFit(field, layout = normalizeNodeGraphTextBoxLayout()) {
  const normalizedLayout = normalizeNodeGraphTextBoxLayout(layout);
  const syncIfConnected = () => {
    if (field?.isConnected) {
      syncNodeGraphTextBoxVisualFit(field, normalizedLayout);
    }
  };
  requestAnimationFrame(syncIfConnected);
  document.fonts?.ready?.then(() => requestAnimationFrame(syncIfConnected));
}

function observeNodeGraphTextBoxVisualFit(field, layout = normalizeNodeGraphTextBoxLayout()) {
  if (!field || !window.ResizeObserver) {
    return;
  }
  nodeGraphTextBoxFitLayouts.set(field, normalizeNodeGraphTextBoxLayout(layout));
  if (!nodeGraphTextBoxResizeObserver) {
    nodeGraphTextBoxResizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const layout = nodeGraphTextBoxFitLayouts.get(entry.target);
        if (layout) {
          scheduleNodeGraphTextBoxVisualFit(entry.target, layout);
        }
      }
    });
  }
  nodeGraphTextBoxResizeObserver.observe(field);
}

function handleNodeGraphTextBoxWheel(event) {
  event.preventDefault();
  event.stopPropagation();
  if (event.deltaY) {
    zoomNodeGraphAt(
      -Math.sign(event.deltaY),
      event.clientX,
      event.clientY,
    );
  }
}

function syncNodeGraphTextBoxElement(element, patchNode) {
  if (!element || !patchNode) {
    return;
  }
  const layout = normalizeNodeGraphTextBoxLayout(patchNode.layout);
  const body = element.querySelector(".node-text-box-body");
  if (!body) {
    return;
  }
  body.dataset.textHorizontalAlign = layout.horizontalAlign;
  body.dataset.textVerticalAlignPercent = String(layout.verticalAlignPercent);
  const desiredTag = "TEXTAREA";
  let field = body.querySelector(".node-text-box-input");
  if (!field || field.tagName !== desiredTag) {
    const replacement = document.createElement("textarea");
    replacement.className = "node-text-box-input";
    replacement.dataset.node = patchNode.id;
    replacement.dataset.textBoxMode = layout.textMode;
    replacement.setAttribute("aria-label", `${nodeGraphNodeDisplayName(patchNode.id)} text display`);
    replacement.readOnly = true;
    replacement.spellcheck = false;
    replacement.tabIndex = -1;
    replacement.rows = 1;
    replacement.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      event.stopPropagation();
    });
    replacement.addEventListener("click", (event) => event.stopPropagation());
    replacement.addEventListener("dblclick", openNodeModuleActionMenu);
    replacement.addEventListener("wheel", handleNodeGraphTextBoxWheel, { passive: false });
    field?.replaceWith(replacement);
    if (!field) {
      body.replaceChildren(replacement);
    }
    field = replacement;
  }
  field.dataset.textAlign = layout.horizontalAlign;
  field.dataset.textBoxMode = layout.textMode;
  field.style.textAlign = layout.horizontalAlign;
  field.style.setProperty("--node-text-box-font-scale", String(layout.textSizePercent / 100));
  if (field.value !== layout.text) {
    field.value = layout.text;
  }
  syncNodeGraphTextBoxVisualFit(field, layout);
  scheduleNodeGraphTextBoxVisualFit(field, layout);
  observeNodeGraphTextBoxVisualFit(field, layout);
}
