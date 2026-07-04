function nodeGraphUiItemTypeForNode(node) {
  return nodeGraphModuleIsGraphType(node?.type) ? "graphEditor" : "moduleControl";
}

function clampNodeGraphUiItemSize(size = {}) {
  const width = Math.round(Number(size.w ?? size.width));
  const height = Math.round(Number(size.h ?? size.height));
  const limits = typeof nodeGraphPatchUiItemSizeLimits === "object"
    ? nodeGraphPatchUiItemSizeLimits
    : { minWidth: 64, maxWidth: 720, minHeight: 28, maxHeight: 420 };
  return {
    h: Number.isFinite(height)
      ? Math.max(limits.minHeight, Math.min(limits.maxHeight, height))
      : limits.minHeight,
    w: Number.isFinite(width)
      ? Math.max(limits.minWidth, Math.min(limits.maxWidth, width))
      : limits.minWidth,
  };
}

function nodeGraphUiItemsPatchClone() {
  const patch = cloneNodeGraphPatch(nodeGraphMvp.patch);
  patch.uiItems = normalizeNodeGraphPatchUiItems(patch.uiItems, {
    nodeIds: new Set(patch.nodes.map((node) => node.id)),
  });
  return patch;
}

function updateNodeGraphUiItem(itemId, updates, status = "ui item changed") {
  const patch = nodeGraphUiItemsPatchClone();
  const item = patch.uiItems.find((entry) => entry.id === itemId);
  if (!item) {
    return false;
  }
  Object.assign(item, updates);
  patch.uiItems = normalizeNodeGraphPatchUiItems(patch.uiItems, {
    nodeIds: new Set(patch.nodes.map((node) => node.id)),
  });
  commitNodeGraphPatch(patch, { status });
  if (!document.getElementById("nodeUiView")?.hidden) {
    renderNodeGraphUiView();
  }
  return true;
}

function nodeGraphUiItemFromElement(element) {
  const itemId = element?.closest?.(".node-ui-item")?.dataset?.uiItem || "";
  return normalizeNodeGraphPatchUiItems(nodeGraphMvp.patch.uiItems).find((item) => item.id === itemId) || null;
}

function beginNodeGraphUiItemDrag(event) {
  if (event.button !== undefined && event.button !== 0) {
    return;
  }
  const itemElement = event.currentTarget?.closest?.(".node-ui-item");
  const item = nodeGraphUiItemFromElement(itemElement);
  if (!item) {
    return;
  }
  nodeGraphMvp.uiItemDragging = {
    h: item.h,
    id: item.id,
    mode: "move",
    pointerId: event.pointerId ?? null,
    startX: event.clientX,
    startY: event.clientY,
    w: item.w,
    x: item.x,
    y: item.y,
  };
  itemElement.classList.add("dragging");
  event.currentTarget.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
}

function beginNodeGraphUiItemResize(event) {
  if (event.button !== undefined && event.button !== 0) {
    return;
  }
  const itemElement = event.currentTarget?.closest?.(".node-ui-item");
  const item = nodeGraphUiItemFromElement(itemElement);
  if (!item) {
    return;
  }
  nodeGraphMvp.uiItemDragging = {
    h: item.h,
    id: item.id,
    mode: "resize",
    pointerId: event.pointerId ?? null,
    startX: event.clientX,
    startY: event.clientY,
    w: item.w,
    x: item.x,
    y: item.y,
  };
  itemElement.classList.add("resizing");
  event.currentTarget.setPointerCapture?.(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
}

function dragNodeGraphUiItem(event) {
  const drag = nodeGraphMvp.uiItemDragging;
  if (!drag || (drag.pointerId !== null && event.pointerId !== undefined && drag.pointerId !== event.pointerId)) {
    return;
  }
  const itemElement = document.querySelector(`.node-ui-item[data-ui-item="${CSS.escape(drag.id)}"]`);
  if (!itemElement) {
    return;
  }
  const dx = Math.round(event.clientX - drag.startX);
  const dy = Math.round(event.clientY - drag.startY);
  if (drag.mode === "resize") {
    const { w, h } = clampNodeGraphUiItemSize({
      h: drag.h + dy,
      w: drag.w + dx,
    });
    itemElement.style.width = `${w}px`;
    itemElement.style.height = `${h}px`;
  } else {
    const x = Math.max(0, Math.min(2000, drag.x + dx));
    const y = Math.max(0, Math.min(2000, drag.y + dy));
    itemElement.style.left = `${x}px`;
    itemElement.style.top = `${y}px`;
  }
  event.preventDefault();
}

function endNodeGraphUiItemDrag(event) {
  const drag = nodeGraphMvp.uiItemDragging;
  if (!drag || (drag.pointerId !== null && event.pointerId !== undefined && drag.pointerId !== event.pointerId)) {
    return;
  }
  const itemElement = document.querySelector(`.node-ui-item[data-ui-item="${CSS.escape(drag.id)}"]`);
  itemElement?.classList.remove("dragging", "resizing");
  nodeGraphMvp.uiItemDragging = null;
  const dx = Math.round(event.clientX - drag.startX);
  const dy = Math.round(event.clientY - drag.startY);
  const updates = drag.mode === "resize"
    ? clampNodeGraphUiItemSize({
        h: drag.h + dy,
        w: drag.w + dx,
      })
    : {
        x: Math.max(0, Math.min(2000, drag.x + dx)),
        y: Math.max(0, Math.min(2000, drag.y + dy)),
      };
  updateNodeGraphUiItem(drag.id, updates, drag.mode === "resize" ? "ui item resized" : "ui item moved");
  event.preventDefault();
}

function bindNodeGraphUiViewEvents() {
  document.addEventListener("pointermove", dragNodeGraphUiItem);
  document.addEventListener("pointerup", endNodeGraphUiItemDrag);
  document.addEventListener("pointercancel", endNodeGraphUiItemDrag);
}

function nodeGraphUiGraphSelectionSummary(sourceNode) {
  const graph = normalizeNodeGraphGraph(sourceNode?.graph);
  const selectedIndex = nodeGraphGraphSelectedNodeIndex(sourceNode?.id, graph, graph.nodes.length - 1);
  const selectedNode = graph.nodes[selectedIndex] || graph.nodes[graph.nodes.length - 1];
  return {
    graph,
    pointLabel: `point ${selectedIndex + 1}/${graph.nodes.length}`,
    selectedIndex,
    shape: normalizeNodeGraphGraphShape(selectedNode?.shape),
    x: Number(selectedNode?.x || 0),
    y: Number(selectedNode?.y || 0),
  };
}

function nodeGraphUiItemGridHeightPx() {
  return typeof nodeGraphGridHeight === "function" ? nodeGraphGridHeight() : 32;
}

function nodeGraphUiItemHeightGu(item) {
  const gridHeight = nodeGraphUiItemGridHeightPx();
  return Math.max(1, Math.round((Number(item?.h) || gridHeight) / gridHeight));
}

function resizeNodeGraphUiItemHeightGu(button, delta) {
  const item = nodeGraphUiItemFromElement(button);
  if (!item) {
    return false;
  }
  const gridHeight = nodeGraphUiItemGridHeightPx();
  const nextHeightGu = Math.max(3, Math.min(14, nodeGraphUiItemHeightGu(item) + Number(delta || 0)));
  return updateNodeGraphUiItem(
    item.id,
    { h: nextHeightGu * gridHeight },
    "ui graph height changed",
  );
}

function updateNodeGraphUiGraphSelectedPoint(sourceNode, updates = {}) {
  if (!sourceNode || !nodeGraphModuleIsGraphType(sourceNode.type)) {
    return false;
  }
  const patch = cloneNodeGraphPatch(nodeGraphMvp.patch);
  const targetNode = patch.nodes.find((node) => node.id === sourceNode.id);
  if (!targetNode || !nodeGraphModuleIsGraphType(targetNode.type)) {
    return false;
  }
  const graph = normalizeNodeGraphGraph(targetNode.graph);
  const selectedIndex = nodeGraphGraphSelectedNodeIndex(targetNode.id, graph, graph.nodes.length - 1);
  const selectedNode = graph.nodes[selectedIndex];
  if (!selectedNode) {
    return false;
  }

  const nextNode = {
    ...selectedNode,
    ...(targetNode.type !== "graph2" && Object.hasOwn(updates, "shape")
      ? { shape: normalizeNodeGraphGraphShape(updates.shape) }
      : {}),
    ...(Object.hasOwn(updates, "x") ? { x: normalizeNodeGraphGraphNumber(updates.x, selectedNode.x) } : {}),
    ...(Object.hasOwn(updates, "y") ? { y: normalizeNodeGraphGraphNumber(updates.y, selectedNode.y) } : {}),
  };
  graph.nodes[selectedIndex] = nextNode;
  targetNode.graph = nodeGraphGraphEndpointYLockEnabledForNode(targetNode)
    ? nodeGraphGraphWithLockedEndpointY(graph, selectedIndex)
    : normalizeNodeGraphGraph(graph);
  const nextIndex = targetNode.graph.nodes.reduce((bestIndex, node, index) => {
    const bestNode = targetNode.graph.nodes[bestIndex];
    const distance = Math.abs(node.x - nextNode.x) + Math.abs(node.y - nextNode.y);
    const bestDistance = Math.abs(bestNode.x - nextNode.x) + Math.abs(bestNode.y - nextNode.y);
    return distance < bestDistance ? index : bestIndex;
  }, 0);
  setNodeGraphGraphSelectedNodeIndex(targetNode.id, targetNode.graph, nextIndex);
  commitNodeGraphPatch(patch, { status: "ui graph point changed" });
  syncNodeGraphGraphDisplaysForNode(targetNode.id, targetNode);
  if (nodeGraphModuleActionTargetNodeId() === targetNode.id) {
    syncNodeGraphGraphControls(targetNode.graph, nextIndex);
  }
  renderNodeGraphUiView();
  return true;
}

function runNodeGraphUiGraphAction(button, action) {
  const display = button?.closest?.(".node-ui-item")?.querySelector?.(".node-module-graph-display");
  if (!display || typeof action !== "function") {
    return false;
  }
  display.focus?.({ preventScroll: true });
  const changed = action();
  if (changed) {
    renderNodeGraphUiView();
  }
  return Boolean(changed);
}

function createNodeGraphUiGraphToolbar(sourceNode, item) {
  const summary = nodeGraphUiGraphSelectionSummary(sourceNode);
  const usesGlobalSmoothing = sourceNode?.type === "graph2";
  const toolbar = document.createElement("div");
  toolbar.className = "node-ui-graph-toolbar";

  const actions = [
    {
      action: () => selectFocusedNodeGraphGraphNodeOffset(-1),
      disabled: summary.selectedIndex <= 0,
      label: "<",
      title: "Select previous point",
    },
    {
      action: () => selectFocusedNodeGraphGraphNodeOffset(1),
      disabled: summary.selectedIndex >= summary.graph.nodes.length - 1,
      label: ">",
      title: "Select next point",
    },
    {
      action: addFocusedNodeGraphGraphNode,
      label: "Add",
      title: "Add point",
    },
    {
      action: duplicateFocusedNodeGraphGraphNode,
      label: "Duplicate",
      title: "Duplicate selected point",
    },
    {
      action: removeFocusedNodeGraphGraphNode,
      disabled: summary.graph.nodes.length <= 2,
      label: "Delete",
      title: "Delete selected point",
    },
    {
      action: cycleFocusedNodeGraphGraphShape,
      disabled: usesGlobalSmoothing,
      label: "Shape",
      title: usesGlobalSmoothing
        ? "Graph 2 uses one global smoothing mode."
        : "Cycle selected point curve shape",
    },
    {
      action: (button) => resizeNodeGraphUiItemHeightGu(button, -1),
      disabled: nodeGraphUiItemHeightGu(item) <= 3,
      label: "H-",
      title: "Shrink UI graph by one grid unit",
    },
    {
      action: (button) => resizeNodeGraphUiItemHeightGu(button, 1),
      disabled: nodeGraphUiItemHeightGu(item) >= 14,
      label: "H+",
      title: "Grow UI graph by one grid unit",
    },
  ];

  actions.forEach((entry) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = entry.label;
    button.title = entry.title;
    button.disabled = Boolean(entry.disabled);
    button.addEventListener("click", () => {
      if (entry.label === "H-" || entry.label === "H+") {
        entry.action(button);
      } else {
        runNodeGraphUiGraphAction(button, entry.action);
      }
    });
    toolbar.append(button);
  });

  return toolbar;
}

function createNodeGraphUiGraphInspector(sourceNode) {
  const summary = nodeGraphUiGraphSelectionSummary(sourceNode);
  const usesGlobalSmoothing = sourceNode?.type === "graph2";
  const inspector = document.createElement("div");
  inspector.className = "node-ui-graph-inspector";

  [
    { label: "x", key: "x", value: summary.x },
    { label: "y", key: "y", value: summary.y },
  ].forEach((entry) => {
    const label = document.createElement("label");
    label.textContent = entry.label;
    const input = document.createElement("input");
    input.type = "number";
    input.min = "0";
    input.max = "1";
    input.step = "0.001";
    input.value = entry.value.toFixed(3);
    input.addEventListener("change", () => updateNodeGraphUiGraphSelectedPoint(sourceNode, {
      [entry.key]: input.value,
    }));
    label.append(input);
    inspector.append(label);
  });

  const shapeLabel = document.createElement("label");
  if (usesGlobalSmoothing) {
    shapeLabel.textContent = "smoothing";
    const mode = document.createElement("input");
    mode.type = "text";
    mode.readOnly = true;
    mode.value = normalizeNodeGraphGraph2SmoothingMode(sourceNode?.params?.smoothingMode);
    shapeLabel.append(mode);
  } else {
    shapeLabel.textContent = "curve";
    const shape = document.createElement("select");
    (Array.isArray(nodeGraphGraphShapes) ? nodeGraphGraphShapes : ["rational", "linear", "smooth", "hold"]).forEach((optionValue) => {
      const option = document.createElement("option");
      option.value = optionValue;
      option.textContent = optionValue;
      option.selected = optionValue === summary.shape;
      shape.append(option);
    });
    shape.addEventListener("change", () => updateNodeGraphUiGraphSelectedPoint(sourceNode, { shape: shape.value }));
    shapeLabel.append(shape);
  }
  inspector.append(shapeLabel);

  return inspector;
}

function createNodeGraphUiGraphStatus(sourceNode, item) {
  const summary = nodeGraphUiGraphSelectionSummary(sourceNode);
  const status = document.createElement("div");
  status.className = "node-ui-graph-status";
  status.textContent = `${summary.pointLabel} - ${nodeGraphUiItemHeightGu(item)} height gu`;
  return status;
}

function createNodeGraphUiItemElement(item) {
  const sourceNode = nodeGraphPatchNode(item.sourceNodeId);
  const article = document.createElement("article");
  article.className = `node-ui-item node-ui-item-${item.type || "moduleControl"}`;
  article.dataset.uiItem = item.id;
  article.dataset.sourceNode = item.sourceNodeId;
  article.style.left = `${item.x}px`;
  article.style.top = `${item.y}px`;
  article.style.width = `${item.w}px`;
  article.style.height = `${item.h}px`;

  const header = document.createElement("div");
  header.className = "node-ui-item-header";
  header.addEventListener("pointerdown", beginNodeGraphUiItemDrag);
  const title = document.createElement("strong");
  title.textContent = sourceNode ? nodeGraphPatchNodeTitle(sourceNode) : item.label;
  const meta = document.createElement("span");
  meta.textContent = nodeGraphModuleIsGraphType(sourceNode?.type) ? "graph editor" : "ui item";
  header.append(title, meta);
  article.append(header);

  const body = document.createElement("div");
  body.className = "node-ui-item-body";
  if (nodeGraphModuleIsGraphType(sourceNode?.type)) {
    body.append(createNodeGraphUiGraphToolbar(sourceNode, item));
    const display = document.createElement("div");
    display.className = "node-module-graph-display node-ui-graph-display";
    display.dataset.graphNode = sourceNode.id;
    display.tabIndex = 0;
    display.setAttribute("aria-label", `${nodeGraphNodeDisplayName(sourceNode.id)} UI graph editor`);
    display.addEventListener("pointerdown", beginNodeGraphGraphNodeDrag, true);
    renderNodeGraphGraphDisplay(display, nodeGraphGraphForNode(sourceNode), null, {
      smoothingMode: nodeGraphGraphSmoothingModeForNode(sourceNode),
    });
    body.append(display);
    body.append(createNodeGraphUiGraphInspector(sourceNode));
    body.append(createNodeGraphUiGraphStatus(sourceNode, item));
  } else {
    const empty = document.createElement("div");
    empty.className = "node-ui-item-placeholder";
    empty.textContent = sourceNode ? "UI control coming soon" : "missing source module";
    body.append(empty);
  }
  article.append(body);
  const resize = document.createElement("button");
  resize.className = "node-ui-item-resize";
  resize.type = "button";
  resize.setAttribute("aria-label", `Resize ${item.label}`);
  resize.addEventListener("pointerdown", beginNodeGraphUiItemResize);
  article.append(resize);
  return article;
}

function renderNodeGraphUiView() {
  const stage = document.getElementById("nodeUiViewStage");
  const status = document.getElementById("nodeUiViewStatus");
  if (!stage) {
    return;
  }
  const items = normalizeNodeGraphPatchUiItems(
    nodeGraphMvp.patch.uiItems,
    { nodeIds: new Set(nodeGraphMvp.patch.nodes.map((node) => node.id)) },
  );
  stage.replaceChildren();
  if (!items.length) {
    const empty = document.createElement("div");
    empty.className = "node-ui-view-empty";
    empty.textContent = "Add a Graph module to UI from its action menu.";
    stage.append(empty);
  } else {
    items.forEach((item) => stage.append(createNodeGraphUiItemElement(item)));
  }
  if (status) {
    status.textContent = items.length === 1 ? "1 UI item" : `${items.length} UI items`;
  }
}
