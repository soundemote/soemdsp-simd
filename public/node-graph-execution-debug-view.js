// This panel sits far down a scrollable sidebar (~2000px below the fold in
// the default layout) -- it's present in the DOM and not display:none, so
// offsetParent alone can't tell "on screen" from "scrolled out of view".
// An IntersectionObserver tracks real viewport visibility asynchronously,
// off the hot path, instead of forcing a synchronous layout reflow via
// getBoundingClientRect() on every call (which the old code effectively
// did indirectly by always recomputing and writing to the DOM regardless).
let nodeGraphExecutionPlanDebugVisible = false;
let nodeGraphExecutionPlanDebugObserver = null;

function nodeGraphEnsureExecutionPlanDebugObserver(status) {
  if (nodeGraphExecutionPlanDebugObserver || typeof IntersectionObserver === "undefined") {
    return;
  }
  nodeGraphExecutionPlanDebugObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      nodeGraphExecutionPlanDebugVisible = entry.isIntersecting;
    }
  });
  nodeGraphExecutionPlanDebugObserver.observe(status);
}

function renderNodeGraphExecutionPlanDebug(providedPlan) {
  const status = document.getElementById("nodeExecutionPlanStatus");
  const debug = document.getElementById("nodeExecutionPlanDebug");
  const jsonStatus = document.getElementById("nodeExecutionJsonStatus");
  const sketch = document.getElementById("nodeRuntimeSketch");
  const sketchStatus = document.getElementById("nodeRuntimeSketchStatus");
  if (!status || !debug || !jsonStatus || !sketch || !sketchStatus) {
    return;
  }
  nodeGraphEnsureExecutionPlanDebugObserver(status);
  // The old `plan = compileNodeGraphExecutionPlan()` default parameter ran
  // a full graph recompile on every call regardless of visibility -- and
  // this function is called with no argument from every slider "input"
  // event during a drag (node-graph-slider-dragging.js), so a full
  // recompile plus several DOM writes ran dozens of times per second for
  // a panel that's normally scrolled off screen. That's what caused the
  // reported 60fps -> 14fps drop while dragging a slider.
  if (providedPlan === undefined && !nodeGraphExecutionPlanDebugVisible) {
    return;
  }
  const plan = providedPlan || compileNodeGraphExecutionPlan();
  const stateReadCount = nodeGraphStateReadCount(plan);
  const activeNodeText = nodeGraphActiveNodeText(plan);
  const activeWireText = nodeGraphActiveWireText(plan);
  status.textContent = plan.valid
    ? [
      "compiled",
      activeNodeText,
      activeWireText,
      stateReadCount ? nodeGraphStateReadText(stateReadCount) : "",
    ].filter(Boolean).join(" / ")
    : "blocked";
  status.title = plan.valid
    ? "Execution model: single-pass stored-output"
    : plan.issues.join(", ");
  status.className = `pill ${plan.valid ? "good" : "warn"}`;
  renderNodeGraphExecutionPlanSummary(plan);
  renderNodeGraphExecutionOrderBadges(plan);
  sketch.textContent = plan.valid
    ? nodeGraphSoemdspRuntimeSketch(plan)
    : `runtime sketch blocked: ${plan.issues.join(", ")}`;
  sketchStatus.textContent = plan.valid ? "ready" : "blocked";
  sketchStatus.title = plan.valid
    ? "Caller-owned C++ runtime mapping sketch"
    : plan.issues.join(", ");
  sketchStatus.className = `pill ${plan.valid ? "good" : "warn"}`;
  debug.textContent = serializeNodeGraphExecutionPlanDebug(plan);
  jsonStatus.textContent = plan.valid ? "ready" : "blocked";
  jsonStatus.title = plan.valid
    ? "Full compiled execution JSON"
    : plan.issues.join(", ");
  jsonStatus.className = `pill ${plan.valid ? "good" : "warn"}`;
}

function renderNodeGraphExecutionOrderBadges(plan) {
  const orderIndex = new Map((plan.order || []).map((nodeId, index) => [nodeId, index + 1]));
  for (const node of document.querySelectorAll(".dsp-node")) {
    const badge = node.querySelector(".node-execution-order-badge");
    if (!badge) {
      continue;
    }
    const nodeId = node.dataset.node;
    const order = orderIndex.get(nodeId);
    if (nodeGraphNodeDisplaysBypassed(nodeId, plan)) {
      badge.textContent = "off";
      badge.dataset.executionState = "bypassed";
      badge.setAttribute("aria-label", `${nodeGraphNodeDisplayName(nodeId)} bypassed`);
      badge.setAttribute("title", nodeId === "output"
        ? "Output off: the live output module is muted from the UI"
        : "Bypassed: removed from compiled engine");
    } else if (order) {
      badge.textContent = String(order);
      badge.dataset.executionState = "active";
      badge.setAttribute("aria-label", `${nodeGraphNodeDisplayName(nodeId)} compiled order ${order}`);
      badge.setAttribute(
        "title",
        `Compiled order ${order}: this module runs at step ${order} in the current execution plan.`,
      );
    } else {
      badge.textContent = "--";
      badge.dataset.executionState = "inactive";
      badge.setAttribute("aria-label", `${nodeGraphNodeDisplayName(nodeId)} inactive`);
      badge.setAttribute("title", "Inactive: not reachable from Output or visual sink");
    }
  }
}

function renderNodeGraphExecutionPlanSummary(plan) {
  const orderList = document.getElementById("nodeExecutionOrder");
  const wireList = document.getElementById("nodeExecutionWireModes");
  if (!orderList || !wireList) {
    return;
  }

  orderList.replaceChildren();
  wireList.replaceChildren();

  const order = plan.valid ? plan.order || [] : plan.order || [];
  if (order.length) {
    for (const [index, nodeId] of order.entries()) {
      const item = document.createElement("li");
      item.dataset.node = nodeId;
      item.dataset.executionOrder = String(index + 1);
      item.tabIndex = -1;
      item.setAttribute("role", "listitem");
      item.setAttribute("aria-label", `Compiled order ${index + 1}: ${nodeGraphNodeDisplayName(nodeId)}`);
      item.textContent = `${index + 1}. ${nodeGraphNodeDisplayName(nodeId)}`;
      orderList.append(item);
    }
  } else {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = plan.issues?.length ? "blocked" : "no active nodes";
    orderList.append(item);
  }

  const rows = nodeGraphExecutionWireRows(plan);
  if (rows.length) {
    for (const row of rows) {
      const item = document.createElement("li");
      item.className = `node-execution-wire-mode ${row.mode}`;
      item.dataset.connectionKind = row.kind;
      item.dataset.connectionIndex = String(row.index);
      item.dataset.wireMode = row.mode;
      item.tabIndex = 0;
      item.setAttribute("role", "button");
      item.setAttribute("title", `Select ${row.kind} wire. ${nodeGraphWireModeHelp(row.mode)}`);
      item.textContent = `${row.kind === "modulation" ? "mod" : "signal"} ${row.source} -> ${row.destination} [${row.mode}]`;
      item.addEventListener("click", () => setNodeGraphSelection({ type: "wire", kind: row.kind, index: row.index }));
      item.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          setNodeGraphSelection({ type: "wire", kind: row.kind, index: row.index });
        }
      });
      wireList.append(item);
    }
  } else {
    const item = document.createElement("li");
    item.className = "empty";
    item.textContent = plan.issues?.length ? plan.issues.join(", ") : "no wires";
    wireList.append(item);
  }
  renderNodeGraphExecutionSummarySelection();
}

function renderNodeGraphExecutionSummarySelection() {
  const selectedNodeIds = nodeGraphSelectedNodeIds();
  for (const item of document.querySelectorAll(".node-execution-order li[data-node]")) {
    item.classList.toggle("selected", selectedNodeIds.has(item.dataset.node));
  }
  for (const item of document.querySelectorAll(".node-execution-wire-modes li[data-connection-index]")) {
    item.classList.toggle(
      "selected",
      sameNodeGraphSelection(nodeGraphMvp.selected, {
        type: "wire",
        kind: item.dataset.connectionKind || "signal",
        index: Number(item.dataset.connectionIndex),
      }),
    );
  }
}

function toggleDebugSections() {
  const collapsed = !document.body.classList.contains("debug-collapsed");
  document.body.classList.toggle("debug-collapsed", collapsed);
  const button = document.getElementById("toggleDebugButton");
  button.textContent = collapsed ? "Show Evidence" : "Hide Evidence";
  button.setAttribute("aria-pressed", String(!collapsed));
}
