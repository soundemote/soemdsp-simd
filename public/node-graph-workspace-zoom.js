function applyNodeGraphZoom() {
  const workspace = document.getElementById("nodeGraphWorkspace");
  if (!workspace) {
    return;
  }
  workspace.style.setProperty("--node-graph-zoom", String(nodeGraphZoom()));
  workspace.dataset.zoom = nodeGraphZoom().toFixed(2);
  applyNodeGraphWorkspaceView();
  updateNodeGraphGridHeatmap();
  if (typeof syncNodeGraphSliderReadouts === "function") {
    syncNodeGraphSliderReadouts();
  }
  const zoomOutButton = document.getElementById("nodeZoomOutButton");
  const zoomResetButton = document.getElementById("nodeZoomResetButton");
  const zoomInButton = document.getElementById("nodeZoomInButton");
  if (zoomOutButton) {
    zoomOutButton.disabled = nodeGraphZoom() <= nodeGraphZoomLimits.min + 0.001;
  }
  if (zoomResetButton) {
    const zoomLabel = nodeGraphZoomLabel();
    if (zoomResetButton.dataset.editingZoom !== "true") {
      zoomResetButton.textContent = zoomLabel;
    }
    zoomResetButton.setAttribute("aria-label", `Current zoom ${zoomLabel}. Reset graph zoom to 1:1`);
    zoomResetButton.removeAttribute("title");
  }
  if (zoomInButton) {
    zoomInButton.disabled = nodeGraphZoom() >= nodeGraphZoomLimits.max - 0.001;
  }
  drawNodeGraphWires();
  if (typeof scheduleNodeGraphModuleScopeDraw === "function") {
    scheduleNodeGraphModuleScopeDraw();
  }
}

function setNodeGraphZoom(nextZoom, anchor = null) {
  const workspace = document.getElementById("nodeGraphWorkspace");
  const workspaceRect = workspace?.getBoundingClientRect();
  const oldZoom = nodeGraphZoom();
  const oldPan = nodeGraphMvp.pan || { x: 0, y: 0 };
  const oldOrigin = workspace ? nodeGraphRenderedOriginOffset(oldPan, workspace) : oldPan;
  const anchorPoint = workspaceRect
    ? (anchor || {
      x: workspaceRect.left + workspaceRect.width / 2,
      y: workspaceRect.top + workspaceRect.height / 2,
    })
    : null;
  const anchoredContentPoint = workspaceRect && anchorPoint
    ? {
      x: (anchorPoint.x - workspaceRect.left - (Number(oldOrigin.x) || 0)) / oldZoom,
      y: (anchorPoint.y - workspaceRect.top - (Number(oldOrigin.y) || 0)) / oldZoom,
    }
    : null;
  const zoom = clampNodeGraphZoom(nextZoom);
  if (Math.abs(zoom - oldZoom) < 0.001) {
    return;
  }
  nodeGraphMvp.zoom = zoom;
  syncNodeGraphPatchViewZoom(zoom);
  const nextCenter = workspace ? nodeGraphWorkspaceCenterOffset(workspace) : { x: 0, y: 0 };
  const nextPan = workspaceRect && anchorPoint && anchoredContentPoint
    ? {
      x: anchorPoint.x - workspaceRect.left - nextCenter.x - anchoredContentPoint.x * zoom,
      y: anchorPoint.y - workspaceRect.top - nextCenter.y - anchoredContentPoint.y * zoom,
    }
    : oldPan;
  nodeGraphMvp.pan = {
    x: Number(nextPan.x) || 0,
    y: Number(nextPan.y) || 0,
  };
  applyNodeGraphZoom();
  applyNodeGraphPan();
  if (typeof saveNodeGraphWorkspaceViewToUserSettings === "function") {
    saveNodeGraphWorkspaceViewToUserSettings({ status: false });
  }
}

function clampNodeGraphZoom(value) {
  const zoom = Number(value);
  const fallback = 1;
  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : fallback;
  const minLog = Math.log(nodeGraphZoomLimits.min);
  const maxLog = Math.log(nodeGraphZoomLimits.max);
  return Math.exp(Math.max(minLog, Math.min(maxLog, Math.log(safeZoom))));
}

function syncNodeGraphPatchViewZoom(zoom = nodeGraphZoom()) {
  if (!nodeGraphMvp.patch) {
    return;
  }
  const view = normalizeNodeGraphPatchView(nodeGraphMvp.patch.view);
  nodeGraphMvp.patch.view = { ...view, zoom: clampNodeGraphZoom(zoom) };
}

function preserveNodeGraphEditorZoomOnPatch(patch = nodeGraphMvp.patch) {
  if (!patch) {
    return;
  }
  const view = normalizeNodeGraphPatchView(patch.view);
  patch.view = { ...view, zoom: clampNodeGraphZoom(nodeGraphMvp.zoom) };
}

// Zoom + pan so the entire patch fits the workspace with a little elbow room.
// `padding` is the fraction of margin to leave (0.12 == ~12% breathing space).
function nodeGraphAutoFrame(options = {}) {
  const workspace = document.getElementById("nodeGraphWorkspace");
  const surface = typeof nodeGraphZoomSurface === "function" ? nodeGraphZoomSurface() : null;
  const host = surface || workspace;
  if (!workspace || !host) {
    return false;
  }
  const nodes = [...host.querySelectorAll(".dsp-node:not(.removed):not([hidden])")];
  if (!nodes.length) {
    return false;
  }
  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const node of nodes) {
    const b = nodeGraphNodeBounds(node);
    if (b.right - b.left <= 0 || b.bottom - b.top <= 0) {
      continue;
    }
    left = Math.min(left, b.left);
    top = Math.min(top, b.top);
    right = Math.max(right, b.right);
    bottom = Math.max(bottom, b.bottom);
  }
  const contentWidth = right - left;
  const contentHeight = bottom - top;
  if (!Number.isFinite(contentWidth) || !Number.isFinite(contentHeight) || contentWidth <= 0 || contentHeight <= 0) {
    return false;
  }
  const rect = workspace.getBoundingClientRect();
  const style = getComputedStyle(workspace);
  const borderX = (Number.parseFloat(style.borderLeftWidth) || 0) + (Number.parseFloat(style.borderRightWidth) || 0);
  const borderY = (Number.parseFloat(style.borderTopWidth) || 0) + (Number.parseFloat(style.borderBottomWidth) || 0);
  const availWidth = Math.max(1, rect.width - borderX);
  const availHeight = Math.max(1, rect.height - borderY);
  const pad = Math.max(0, Math.min(0.4, Number.isFinite(Number(options.padding)) ? Number(options.padding) : 0.06));
  const usableWidth = availWidth * (1 - pad);
  const usableHeight = availHeight * (1 - pad);
  const zoom = clampNodeGraphZoom(Math.min(usableWidth / contentWidth, usableHeight / contentHeight));
  const centerX = (left + right) / 2;
  const centerY = (top + bottom) / 2;
  nodeGraphMvp.zoom = zoom;
  syncNodeGraphPatchViewZoom(zoom);
  applyNodeGraphZoom();
  setNodeGraphPan(-centerX * zoom, -centerY * zoom, { persist: false });
  return true;
}

if (typeof window !== "undefined") {
  window.nodeGraphAutoFrame = nodeGraphAutoFrame;
}

function nodeGraphZoomRatioBySteps(steps, baseRatio = nodeGraphZoomLimits.wheelRatio) {
  const stepCount = Number(steps) || 0;
  const ratio = Number(baseRatio);
  if (!Number.isFinite(ratio) || ratio <= 0 || ratio === 1 || !stepCount) {
    return 1;
  }
  return Math.exp(Math.log(ratio) * stepCount);
}

function nodeGraphZoomButtonRatio(event) {
  if (event?.ctrlKey || event?.metaKey) {
    return nodeGraphZoomLimits.fineRatio;
  }
  if (event?.shiftKey) {
    return nodeGraphZoomLimits.quarterRatio;
  }
  return nodeGraphZoomLimits.buttonRatio;
}

function nodeGraphWheelZoomSteps(event) {
  const deltaModeScale = event?.deltaMode === 1
    ? 16
    : event?.deltaMode === 2 ? 800 : 1;
  return -(Number(event?.deltaY) || 0) * deltaModeScale / 100;
}

function nodeGraphZoomBySteps(steps, anchor = null, baseRatio = nodeGraphZoomLimits.wheelRatio) {
  setNodeGraphZoom(nodeGraphZoom() * nodeGraphZoomRatioBySteps(steps, baseRatio), anchor);
}

function zoomNodeGraphBy(delta) {
  const event = arguments[1] || window.event || null;
  const direction = Math.sign(delta);
  if (!direction) {
    return;
  }
  nodeGraphZoomBySteps(direction, null, nodeGraphZoomButtonRatio(event));
}

function zoomNodeGraphAt(delta, clientX, clientY) {
  const steps = Number(delta) || 0;
  if (!steps) {
    return;
  }
  nodeGraphZoomBySteps(steps, { x: clientX, y: clientY });
}

function resetNodeGraphZoomToOne() {
  const oldPan = nodeGraphMvp.pan || { x: 0, y: 0 };
  nodeGraphMvp.zoom = 1;
  syncNodeGraphPatchViewZoom(1);
  nodeGraphMvp.pan = {
    x: snapNodeGraphPanValueToGrid(oldPan.x, nodeGraphGridWidth(), 1),
    y: snapNodeGraphPanValueToGrid(oldPan.y, nodeGraphGridHeight(), 1),
  };
  applyNodeGraphZoom();
  applyNodeGraphPan();
  if (typeof saveNodeGraphWorkspaceViewToUserSettings === "function") {
    saveNodeGraphWorkspaceViewToUserSettings({ status: false });
  }
}

function normalizeNodeGraphZoomInput(value) {
  const zoom = Number.parseFloat(String(value).trim());
  if (!Number.isFinite(zoom)) {
    return null;
  }
  return clampNodeGraphZoom(zoom);
}

function finishNodeGraphZoomInput(input, options = {}) {
  const button = input.closest("#nodeZoomResetButton");
  if (!button) {
    return;
  }
  if (button.dataset.editingZoom !== "true") {
    return;
  }
  const shouldApply = options.apply !== false;
  const zoom = shouldApply ? normalizeNodeGraphZoomInput(input.value) : null;
  button.dataset.editingZoom = "false";
  if (shouldApply && zoom !== null) {
    setNodeGraphZoom(zoom);
  } else {
    applyNodeGraphZoom();
  }
  button.focus({ preventScroll: true });
}

function beginNodeGraphZoomInput(event) {
  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement) || button.dataset.editingZoom === "true") {
    return;
  }
  if (nodeGraphMvp.zoomResetClickTimer) {
    window.clearTimeout(nodeGraphMvp.zoomResetClickTimer);
    nodeGraphMvp.zoomResetClickTimer = 0;
  }
  event.preventDefault();
  event.stopPropagation();
  button.dataset.editingZoom = "true";
  const input = document.createElement("input");
  input.className = "node-zoom-reset-input";
  input.type = "text";
  input.inputMode = "decimal";
  input.autocomplete = "off";
  input.spellcheck = false;
  input.value = nodeGraphZoomLabel();
  input.setAttribute("aria-label", "Set modular zoom level");
  input.addEventListener("click", (inputEvent) => inputEvent.stopPropagation());
  input.addEventListener("dblclick", (inputEvent) => inputEvent.stopPropagation());
  input.addEventListener("keydown", (inputEvent) => {
    if (inputEvent.key === "Enter") {
      inputEvent.preventDefault();
      finishNodeGraphZoomInput(input, { apply: true });
    } else if (inputEvent.key === "Escape") {
      inputEvent.preventDefault();
      finishNodeGraphZoomInput(input, { apply: false });
    }
  });
  input.addEventListener("blur", () => finishNodeGraphZoomInput(input, { apply: true }));
  button.replaceChildren(input);
  input.focus({ preventScroll: true });
  input.select();
}

function handleNodeGraphZoomResetClick(event) {
  const button = event.currentTarget;
  if (!(button instanceof HTMLButtonElement) || button.dataset.editingZoom === "true") {
    return;
  }
  if (nodeGraphMvp.zoomResetClickTimer) {
    window.clearTimeout(nodeGraphMvp.zoomResetClickTimer);
  }
  nodeGraphMvp.zoomResetClickTimer = window.setTimeout(() => {
    nodeGraphMvp.zoomResetClickTimer = 0;
    resetNodeGraphZoomToOne();
  }, 180);
}

function handleNodeGraphWorkspaceWheel(event) {
  if (!event.deltaY) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  zoomNodeGraphAt(
    nodeGraphWheelZoomSteps(event),
    event.clientX,
    event.clientY,
  );
}

function beginNodeGraphSmoothZoomDrag(event) {
  const ctrlZoom = event.ctrlKey;
  const altZoom = event.altKey;
  if (
    event.button !== 1 ||
    (!ctrlZoom && !altZoom)
  ) {
    return;
  }

  const workspace = event.currentTarget;
  nodeGraphMvp.smoothZoomDragging = {
    anchor: { x: event.clientX, y: event.clientY },
    pointerId: event.pointerId,
    startClientY: event.clientY,
    startZoom: nodeGraphZoom(),
  };
  workspace.classList.add("smooth-zooming");
  workspace.setPointerCapture(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
}

function dragNodeGraphSmoothZoom(event) {
  const drag = nodeGraphMvp.smoothZoomDragging;
  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }

  const deltaY = drag.startClientY - event.clientY;
  const ratio = Math.exp(deltaY * 0.0045);
  setNodeGraphZoom(drag.startZoom * ratio, drag.anchor);
  event.preventDefault();
  event.stopPropagation();
}

function endNodeGraphSmoothZoomDrag(event) {
  const drag = nodeGraphMvp.smoothZoomDragging;
  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }

  const workspace = document.getElementById("nodeGraphWorkspace");
  if (workspace?.hasPointerCapture?.(event.pointerId)) {
    workspace.releasePointerCapture(event.pointerId);
  }
  workspace?.classList.remove("smooth-zooming");
  nodeGraphMvp.smoothZoomDragging = null;
  event.preventDefault();
  event.stopPropagation();
}
