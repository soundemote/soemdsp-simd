// Phosphor Grid -- a dedicated, minimal phosphor simulation. No WebGL, no
// shader, no framebuffer, no GPU context at all. Two small canvases per
// node, both locked to the display's pixel resolution AT 1.00 ZOOM
// (nodeGraphModuleScopeUnzoomedLength divides the canvas's current pixel
// size by the current zoom factor), independent of its actual on-screen
// (possibly zoomed) CSS size:
//
// 1. A persistent, hidden "sim" canvas that IS the simulation: brightness
//    lives entirely in its alpha channel. Each frame we fade it (a
//    destination-out fill is a native, hardware-composited multiplicative
//    decay -- no per-pixel JS loop) and stroke the newest points onto it in
//    opaque white. Native canvas path stroking is antialiased by the
//    browser for free, which is what was missing when this briefly became
//    a hand-rolled hard-edged Bresenham grid and looked like a jagged mess
//    instead of a nice phosphor trail -- letting the browser draw the line
//    is both cheaper AND smoother than doing it pixel-by-pixel in JS.
//
// 2. The real, visible display canvas. Color is applied exactly once, as a
//    cheap post-process: read the sim canvas's alpha channel as brightness
//    and linearly interpolate between gradientLow (brightness 0) and
//    gradientHigh (brightness 1) to build the displayed pixels. This is a
//    gradient LOOKUP, not a color carried through the whole simulation --
//    the sim canvas never has color in it at all.
//
// The display canvas's backing-store resolution is locked to that same
// native-at-1.00-zoom size while its CSS size (width:100%/height:100% in
// styles.css) still fills the real, currently-zoomed container -- stretching
// a small backing store to a bigger CSS box is normal browser compositing,
// not something paid for in JS. Past zoom 1.00 that's an UPSCALE, and
// image-rendering: pixelated makes that free upscale nearest-neighbor,
// which is what reveals the grid as blocks once you zoom in. Below zoom
// 1.00 the same backing store is being DOWNSCALED to fit a smaller box --
// nearest-neighbor there just drops samples and looks aliased/noisy, so we
// switch to "auto" (the browser's normal smooth/averaging scale) whenever
// we're shrinking rather than growing. Simulation cost is unaffected either
// way; this only changes which built-in compositor filter gets used.

const nodeGraphPhosphorGrid2dGrids = new Map();

function nodeGraphPhosphorGrid2dNativeSize(scopeElement, pixelRatio, resolutionScale) {
  const rect = scopeElement.getBoundingClientRect();
  const zoomedWidth = Math.max(1, Math.round(rect.width * pixelRatio));
  const zoomedHeight = Math.max(1, Math.round(rect.height * pixelRatio));
  return {
    height: clampNodeSliderValue(Math.round(nodeGraphModuleScopeUnzoomedLength(zoomedHeight) * resolutionScale), 1, 2048),
    width: clampNodeSliderValue(Math.round(nodeGraphModuleScopeUnzoomedLength(zoomedWidth) * resolutionScale), 1, 2048),
    zoomedHeight,
    zoomedWidth,
  };
}

function nodeGraphPhosphorGrid2dState(nodeId, width, height) {
  let state = nodeGraphPhosphorGrid2dGrids.get(nodeId);
  if (!state || state.width !== width || state.height !== height) {
    const simCanvas = document.createElement("canvas");
    simCanvas.width = width;
    simCanvas.height = height;
    state = {
      height,
      lastX: NaN,
      lastY: NaN,
      simCanvas,
      width,
    };
    nodeGraphPhosphorGrid2dGrids.set(nodeId, state);
  }
  return state;
}

function nodeGraphPhosphorGrid2dDisplayCanvas(scopeElement, upscaling) {
  let canvas = scopeElement.querySelector(":scope > .node-module-scope-local-fallback-canvas");
  if (!canvas) {
    canvas = document.createElement("canvas");
    canvas.className = "node-module-scope-local-fallback-canvas";
    canvas.setAttribute("aria-hidden", "true");
    scopeElement.appendChild(canvas);
  }
  const imageRendering = upscaling ? "pixelated" : "auto";
  if (canvas.style.imageRendering !== imageRendering) {
    canvas.style.imageRendering = imageRendering;
  }
  // The shared CSS rule for this class is mix-blend-mode: screen, tuned for
  // additive monochrome (screen-with-black is a no-op). Now that Phosphor
  // Grid paints an arbitrary gradientLow color as its "off" state, screen
  // blending would tint whatever's underneath even when gradientLow isn't
  // black, so this module opts out and composites normally instead.
  if (canvas.style.mixBlendMode !== "normal") {
    canvas.style.mixBlendMode = "normal";
  }
  return canvas;
}

function nodeGraphPhosphorGrid2dSampleToCanvasPoint(x, y, width, height, scale) {
  return {
    x: clampNodeSliderValue(x * scale * 0.5 + 0.5, 0, 1) * width,
    y: (1 - clampNodeSliderValue(y * scale * 0.5 + 0.5, 0, 1)) * height,
  };
}

function nodeGraphPhosphorGrid2dStrokeSamples(state, width, height, xSamples, ySamples, count, scale) {
  const context = state.simCanvas.getContext("2d");
  context.save();
  context.globalCompositeOperation = "source-over";
  context.strokeStyle = "#ffffff";
  context.lineWidth = 1;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  let havePrevious = Number.isFinite(state.lastX) && Number.isFinite(state.lastY);
  if (havePrevious) {
    context.moveTo(state.lastX, state.lastY);
  }
  for (let index = 0; index < count; index += 1) {
    const x = Number(xSamples[index]);
    const y = Number(ySamples[index]);
    if (!Number.isFinite(x) || !Number.isFinite(y)) {
      havePrevious = false;
      continue;
    }
    const point = nodeGraphPhosphorGrid2dSampleToCanvasPoint(x, y, width, height, scale);
    if (havePrevious) {
      context.lineTo(point.x, point.y);
    } else {
      context.moveTo(point.x, point.y);
    }
    state.lastX = point.x;
    state.lastY = point.y;
    havePrevious = true;
  }
  if (!havePrevious) {
    state.lastX = NaN;
    state.lastY = NaN;
  }
  context.stroke();
  context.restore();
}

function drawNodeGraphPhosphorGrid2dItem(renderer, item, pixelRatio) {
  const slot = item?.slot;
  const buffer = item?.buffer;
  const screenElement = item?.screenElement || slot?.scopeElement;
  if (!slot || !buffer?.nodeGraphScopeXy || !buffer.x?.length || !buffer.y?.length || !screenElement) {
    return false;
  }
  const settings = nodeGraphPhosphorGrid2dSettingsForNode(nodeGraphModuleScopeNodeForSlot(slot));
  const { width, height, zoomedWidth, zoomedHeight } = nodeGraphPhosphorGrid2dNativeSize(screenElement, pixelRatio, settings.resolutionScale);
  const upscaling = zoomedWidth > width || zoomedHeight > height;
  const state = nodeGraphPhosphorGrid2dState(slot.nodeId, width, height);
  const simContext = state.simCanvas.getContext("2d");

  const decay = clampNodeSliderValue(settings.decay, 0, 1);
  if (decay > 0) {
    simContext.save();
    simContext.globalCompositeOperation = "destination-out";
    simContext.fillStyle = `rgba(0, 0, 0, ${decay})`;
    simContext.fillRect(0, 0, width, height);
    simContext.restore();
  }
  if (settings.dot1Enabled !== false) {
    const scale = Math.max(0, Number(settings.scale) || 1);
    nodeGraphPhosphorGrid2dStrokeSamples(state, width, height, buffer.x, buffer.y, buffer.length, scale);
  } else {
    state.lastX = NaN;
    state.lastY = NaN;
  }

  const canvas = nodeGraphPhosphorGrid2dDisplayCanvas(screenElement, upscaling);
  if (canvas.width !== width) {
    canvas.width = width;
  }
  if (canvas.height !== height) {
    canvas.height = height;
  }
  const context = canvas.getContext("2d");
  if (!context) {
    return false;
  }
  const brightness = Math.max(0, Number(settings.dot1Brightness) || 0);
  const low = nodeGraphScopeHexColorToRgb(settings.gradientLow)
    .map((component) => clampNodeSliderValue(component, 0, 1) * 255);
  const high = nodeGraphScopeHexColorToRgb(settings.gradientHigh)
    .map((component) => clampNodeSliderValue(component, 0, 1) * 255);
  const simData = simContext.getImageData(0, 0, width, height).data;
  const outData = context.createImageData(width, height);
  for (let index = 0; index < simData.length; index += 4) {
    const t = clampNodeSliderValue((simData[index + 3] / 255) * brightness, 0, 1);
    outData.data[index] = Math.round(low[0] + (high[0] - low[0]) * t);
    outData.data[index + 1] = Math.round(low[1] + (high[1] - low[1]) * t);
    outData.data[index + 2] = Math.round(low[2] + (high[2] - low[2]) * t);
    outData.data[index + 3] = 255;
  }
  context.putImageData(outData, 0, 0);
  recordNodeGraphModuleScopeRenderMetrics(buffer.length, width * height);
  return true;
}
