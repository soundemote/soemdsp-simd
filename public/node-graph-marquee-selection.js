function renderNodeGraphMarqueeSelection() {
  const marquee = document.getElementById("nodeSelectionMarquee");
  const drag = nodeGraphMvp.marqueeSelection;
  if (!marquee || !drag) {
    if (marquee) {
      marquee.hidden = true;
    }
    return;
  }

  const rect = nodeGraphRectFromPoints(drag.start, drag.current);
  marquee.hidden = false;
  marquee.style.left = `${rect.left}px`;
  marquee.style.top = `${rect.top}px`;
  marquee.style.width = `${rect.width}px`;
  marquee.style.height = `${rect.height}px`;
}

function nodeGraphNodesInsideRect(rect) {
  const ids = [];
  for (const node of document.querySelectorAll(".dsp-node:not(.removed)")) {
    if (nodeGraphRectsIntersect(rect, nodeGraphNodeBounds(node))) {
      ids.push(node.dataset.node);
    }
  }
  return ids;
}

function updateNodeGraphMarqueeSelection() {
  const drag = nodeGraphMvp.marqueeSelection;
  if (!drag) {
    return;
  }

  const rect = nodeGraphRectFromPoints(drag.start, drag.current);
  const ids = drag.additive
    ? [...new Set([...(drag.startSelectedIds || []), ...nodeGraphNodesInsideRect(rect)])]
    : nodeGraphNodesInsideRect(rect);
  setNodeGraphNodeSelection(ids);
  renderNodeGraphMarqueeSelection();
}

function nodeGraphMarqueeTargetIsBlocked(target) {
  return Boolean(target?.closest?.(
    ".dsp-node, .node-port, .node-param-port, .node-slider-readout, .node-wire-hit-path, button, input, textarea, select",
  ));
}

function startNodeGraphMarqueeSelection(event, workspace) {
  const point = nodeGraphClientPoint(event);
  const additive = event.shiftKey || event.ctrlKey || event.metaKey;
  nodeGraphMvp.marqueeSelection = {
    additive,
    current: point,
    moved: false,
    pointerId: event.pointerId,
    start: point,
    startSelectedIds: [...nodeGraphSelectedNodeIds()],
  };
  if (!additive) {
    setNodeGraphSelection(null);
  }
  renderNodeGraphMarqueeSelection();
  workspace.setPointerCapture(event.pointerId);
  event.preventDefault();
  event.stopPropagation();
}

function beginNodeGraphMarqueeSelection(event) {
  if (
    event.button !== 0 ||
    event.ctrlKey ||
    nodeGraphMarqueeTargetIsBlocked(event.target)
  ) {
    return;
  }

  startNodeGraphMarqueeSelection(event, event.currentTarget);
}

function nodeGraphOutsideMarqueeStartIsBlocked(target) {
  return Boolean(target?.closest?.(
    "#nodeGraphWorkspace, #nodeSceneContextMenu, #nodeParameterMetadataPopover, #nodeUiDevHelper, #nodeUserUiSettingsPanel, button, input, textarea, select",
  ));
}

function trackNodeGraphOutsideMarqueePointer(event) {
  if (event.button !== 0 || nodeGraphOutsideMarqueeStartIsBlocked(event.target)) {
    nodeGraphMvp.marqueeSelectionEntryPointer = null;
    return;
  }
  nodeGraphMvp.marqueeSelectionEntryPointer = {
    additive: event.shiftKey || event.ctrlKey || event.metaKey,
    pointerId: event.pointerId,
  };
}

function clearNodeGraphOutsideMarqueePointer(event) {
  if (
    !nodeGraphMvp.marqueeSelectionEntryPointer ||
    nodeGraphMvp.marqueeSelectionEntryPointer.pointerId === event.pointerId
  ) {
    nodeGraphMvp.marqueeSelectionEntryPointer = null;
  }
}

function beginNodeGraphMarqueeSelectionOnEntry(event) {
  const entry = nodeGraphMvp.marqueeSelectionEntryPointer;
  if (
    !entry ||
    entry.pointerId !== event.pointerId ||
    !(event.buttons & 1) ||
    event.ctrlKey ||
    nodeGraphMvp.marqueeSelection ||
    nodeGraphMvp.dragging ||
    nodeGraphMvp.nodeDragging ||
    nodeGraphMvp.workspacePanning ||
    nodeGraphMvp.smoothZoomDragging ||
    nodeGraphMvp.workspaceResizing
  ) {
    return;
  }
  startNodeGraphMarqueeSelection(event, event.currentTarget);
  nodeGraphMvp.marqueeSelectionEntryPointer = null;
}

function dragNodeGraphMarqueeSelection(event) {
  const drag = nodeGraphMvp.marqueeSelection;
  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }

  drag.current = nodeGraphClientPoint(event);
  drag.moved ||=
    Math.abs(drag.current.x - drag.start.x) > 3 ||
    Math.abs(drag.current.y - drag.start.y) > 3;
  if (drag.moved) {
    updateNodeGraphMarqueeSelection();
  } else {
    renderNodeGraphMarqueeSelection();
  }
  event.preventDefault();
  event.stopPropagation();
}

function endNodeGraphMarqueeSelection(event) {
  const drag = nodeGraphMvp.marqueeSelection;
  if (!drag || drag.pointerId !== event.pointerId) {
    return;
  }

  if (drag.moved) {
    updateNodeGraphMarqueeSelection();
  } else if (!drag.additive) {
    setNodeGraphSelection(null);
  }
  nodeGraphMvp.marqueeSelection = null;
  renderNodeGraphMarqueeSelection();
  if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
    event.currentTarget.releasePointerCapture(event.pointerId);
  }
  event.preventDefault();
  event.stopPropagation();
}
