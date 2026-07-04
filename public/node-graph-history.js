function recordNodeGraphHistory() {
  const snapshot = serializeNodeGraphPatch();
  if (nodeGraphMvp.historySnapshots[nodeGraphMvp.historyIndex] === snapshot) {
    renderNodeGraphHistoryControls();
    return;
  }
  nodeGraphMvp.historySnapshots = nodeGraphMvp.historySnapshots.slice(0, nodeGraphMvp.historyIndex + 1);
  nodeGraphMvp.historySnapshots.push(snapshot);
  if (nodeGraphMvp.historySnapshots.length > nodeGraphMvp.historyLimit) {
    nodeGraphMvp.historySnapshots.shift();
  }
  nodeGraphMvp.historyIndex = nodeGraphMvp.historySnapshots.length - 1;
  renderNodeGraphHistoryControls();
}

function undoNodeGraphPatch() {
  if (!nodeGraphScriptReadyForGraphAction("undo")) {
    return;
  }
  if (nodeGraphMvp.historyIndex <= 0) {
    return;
  }
  nodeGraphMvp.historyIndex -= 1;
  commitNodeGraphPatch(loadNodeGraphPatchFromScript(nodeGraphMvp.historySnapshots[nodeGraphMvp.historyIndex]), {
    record: false,
    status: "undo",
  });
}

function redoNodeGraphPatch() {
  if (!nodeGraphScriptReadyForGraphAction("redo")) {
    return;
  }
  if (nodeGraphMvp.historyIndex >= nodeGraphMvp.historySnapshots.length - 1) {
    return;
  }
  nodeGraphMvp.historyIndex += 1;
  commitNodeGraphPatch(loadNodeGraphPatchFromScript(nodeGraphMvp.historySnapshots[nodeGraphMvp.historyIndex]), {
    record: false,
    status: "redo",
  });
}
