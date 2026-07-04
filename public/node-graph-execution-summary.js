function nodeGraphWireModeHelp(mode) {
  switch (mode) {
    case "same-pass":
      return "same-pass: source already ran this frame";
    case "state-read":
      return "state-read: reads the stored previous output";
    case "bypassed":
      return "bypassed: compiler ignores the touched node or wire";
    case "inactive":
      return "inactive: not reachable from Output or visual sink";
    default:
      return "unknown wire execution mode";
  }
}

function nodeGraphStateReadCount(plan) {
  return (plan.feedbackConnections?.length || 0) + (plan.feedbackModulations?.length || 0);
}

function nodeGraphStateReadText(count) {
  return count === 1 ? "1 state read" : `${count} state reads`;
}

function nodeGraphActiveNodeText(plan) {
  const patchNodeCount = plan.nodes?.length || 0;
  const activeNodeCount = plan.reachableNodes?.length || 0;
  const bypassedCount = plan.bypassedNodes?.length || 0;
  if (bypassedCount) {
    return `${activeNodeCount}/${patchNodeCount} active / ${bypassedCount} bypassed`;
  }
  return patchNodeCount > activeNodeCount
    ? `${activeNodeCount}/${patchNodeCount} active`
    : "";
}

function nodeGraphActiveWireCount(plan) {
  return nodeGraphActiveSignalConnections(plan).length + nodeGraphActiveModulations(plan).length;
}

function nodeGraphPatchWireCount(plan) {
  return (plan.connections?.length || 0) + (plan.modulations?.length || 0);
}

function nodeGraphActiveWireText(plan) {
  const patchWireCount = nodeGraphPatchWireCount(plan);
  const activeWireCount = nodeGraphActiveWireCount(plan);
  return patchWireCount > activeWireCount
    ? `${activeWireCount}/${patchWireCount} wires`
    : "";
}

function nodeGraphScheduleText(order, issues = [], feedbackConnections = [], feedbackModulations = []) {
  if (issues.length) {
    return `schedule blocked: ${issues.join(", ")}`;
  }
  const feedbackText = nodeGraphFeedbackText(feedbackConnections, feedbackModulations);
  const suffix = feedbackText ? ` / feedback: ${feedbackText}` : "";
  return order.length
    ? `schedule: ${order.map((node) => nodeGraphNodeDisplayName(node)).join(" -> ")}${suffix}`
    : "schedule missing";
}
