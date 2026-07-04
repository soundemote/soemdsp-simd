function nodeGraphTracePoint(value) {
  return Math.round((Number(value) || 0) - 0.5) + 0.5;
}

function normalizeNodeGraphTracePoints(points) {
  if (!Array.isArray(points)) {
    return [];
  }
  return points
    .map((point) => ({
      x: nodeGraphTracePoint(point?.x),
      y: nodeGraphTracePoint(point?.y),
    }))
    .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
}

function nodeGraphTraceWaypointAttribute(points) {
  return JSON.stringify(normalizeNodeGraphTracePoints(points));
}

function nodeGraphTracePushPoint(points, point) {
  const previous = points[points.length - 1];
  if (!previous || Math.abs(previous.x - point.x) > 0.001 || Math.abs(previous.y - point.y) > 0.001) {
    points.push(point);
  }
}

function nodeGraphTraceOrthogonalPoints(from, points, to) {
  const anchors = normalizeNodeGraphTracePoints([from, ...normalizeNodeGraphTracePoints(points), to]);
  if (anchors.length < 2) {
    return anchors;
  }
  const routed = [];
  nodeGraphTracePushPoint(routed, anchors[0]);
  for (const anchor of anchors.slice(1)) {
    const previous = routed[routed.length - 1];
    if (Math.abs(previous.x - anchor.x) > 0.001 && Math.abs(previous.y - anchor.y) > 0.001) {
      nodeGraphTracePushPoint(routed, { x: anchor.x, y: previous.y });
    }
    nodeGraphTracePushPoint(routed, anchor);
  }
  return routed;
}

function nodeGraphTracePathFromPoints(from, points, to) {
  const allPoints = nodeGraphTraceOrthogonalPoints(from, points, to);
  if (!allPoints.length) {
    return "";
  }
  const [start, ...rest] = allPoints;
  return [
    `M ${start.x} ${start.y}`,
    ...rest.map((point) => `L ${point.x} ${point.y}`),
  ].join(" ");
}
