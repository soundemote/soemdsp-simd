// Stereo Scope module -- development home for the Left/Right stereo trace
// display. Kept in its own file (rather than folded into the generic trace
// renderer in node-graph-module-scopes.js) so this feature can keep evolving
// independently: it currently owns two things the generic trace/Output
// renderer does not have --
//
// 1. Intersection-based color mixing. Overlaying two additively-blended
//    colored lines (red left, blue right) makes their overlap go magenta,
//    which reads as "two lights stacking", not "two signals agreeing". Instead
//    treat the amount of simultaneous coverage as its own signal and route it
//    to green:
//
//      m = a * b                    (soft/smooth "how much both are here")
//      (R, G, B) = (a - m, m, b - m)
//
//    a/b are the two channels' rendered-stroke coverage (0..1) at a given
//    pixel. Using the product (rather than min(a,b)) keeps the transition
//    smooth across the whole frame -- no hard corner at a=b. Left-only or
//    right-only pixels fall back to their own color untouched; fully-
//    overlapping pixels turn pure green. Total coverage after the mix is
//    a + b - m (never more than additive, same "soft union" as fuzzy-OR).
//
// 2. A final Hue Shift control that rotates the whole composited image's hue
//    after the above mix, via the canvas element's CSS hue-rotate filter --
//    free/GPU-accelerated, and it's applied last so it never disturbs the
//    R/G/B math above.

function nodeGraphStereoScopeMaskCanvas(canvas, side) {
  if (!canvas) {
    return null;
  }
  const cacheKey = side === "left" ? "_nodeGraphStereoScopeMaskLeft" : "_nodeGraphStereoScopeMaskRight";
  let mask = canvas[cacheKey];
  if (!mask) {
    mask = document.createElement("canvas");
    canvas[cacheKey] = mask;
  }
  if (mask.width !== canvas.width) {
    mask.width = canvas.width;
  }
  if (mask.height !== canvas.height) {
    mask.height = canvas.height;
  }
  return mask;
}

function drawNodeGraphStereoScopeMask(maskCanvas, points, settings) {
  const context = maskCanvas.getContext("2d");
  if (!context) {
    return;
  }
  context.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
  const enabled = settings.dot1Enabled !== false;
  const size = clampNodeSliderValue(settings.dot1Size, 0, 1);
  const brightness = Math.max(0, Number(settings.dot1Brightness) || 0);
  if (!enabled || size <= 0 || brightness <= 0 || !Array.isArray(points) || points.length < 2) {
    return;
  }
  const blur = clampNodeSliderValue(settings.lineThickness, 0, 1);
  const lineWidth = Math.max(1, Math.min(maskCanvas.width, maskCanvas.height) * size);
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = lineWidth;
  context.strokeStyle = `rgba(255, 255, 255, ${Math.min(1, brightness)})`;
  context.shadowColor = `rgba(255, 255, 255, ${Math.min(1, brightness)})`;
  context.shadowBlur = lineWidth * blur * 1.5;
  context.beginPath();
  drawNodeGraphScopeCanvasSmoothPath(context, points);
  context.stroke();
  context.restore();
}

function nodeGraphStereoScopeMixPixel(a, b, leftRgb, rightRgb) {
  const m = a * b;
  const uniqueLeft = a - m;
  const uniqueRight = b - m;
  return [
    uniqueLeft * leftRgb[0] + uniqueRight * rightRgb[0],
    uniqueLeft * leftRgb[1] + m + uniqueRight * rightRgb[1],
    uniqueLeft * leftRgb[2] + uniqueRight * rightRgb[2],
    Math.max(a, b),
  ];
}

function drawNodeGraphStereoScopeCanvasLayers(context, canvas, leftPoints, rightPoints, leftSettings, rightSettings, hueShiftDegrees) {
  const maskLeft = nodeGraphStereoScopeMaskCanvas(canvas, "left");
  const maskRight = nodeGraphStereoScopeMaskCanvas(canvas, "right");
  if (!maskLeft || !maskRight) {
    return;
  }
  drawNodeGraphStereoScopeMask(maskLeft, leftPoints, leftSettings);
  drawNodeGraphStereoScopeMask(maskRight, rightPoints, rightSettings);
  const width = canvas.width;
  const height = canvas.height;
  if (width <= 0 || height <= 0) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const dataLeft = maskLeft.getContext("2d").getImageData(0, 0, width, height).data;
  const dataRight = maskRight.getContext("2d").getImageData(0, 0, width, height).data;
  const leftRgb = nodeGraphScopeHexColorToRgb(leftSettings.color);
  const rightRgb = nodeGraphScopeHexColorToRgb(rightSettings.color);
  const out = context.createImageData(width, height);
  for (let index = 0; index < dataLeft.length; index += 4) {
    const a = dataLeft[index + 3] / 255;
    const b = dataRight[index + 3] / 255;
    if (a <= 0 && b <= 0) {
      continue;
    }
    const [r, g, bch, alpha] = nodeGraphStereoScopeMixPixel(a, b, leftRgb, rightRgb);
    out.data[index] = Math.round(clampNodeSliderValue(r, 0, 1) * 255);
    out.data[index + 1] = Math.round(clampNodeSliderValue(g, 0, 1) * 255);
    out.data[index + 2] = Math.round(clampNodeSliderValue(bch, 0, 1) * 255);
    out.data[index + 3] = Math.round(clampNodeSliderValue(alpha, 0, 1) * 255);
  }
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.putImageData(out, 0, 0);
  const hueShift = Number(hueShiftDegrees) || 0;
  canvas.style.filter = hueShift ? `hue-rotate(${hueShift}deg)` : "";
}
