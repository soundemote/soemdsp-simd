const nodeSliderHandleHalfWidthPx = 8;
const nodeSliderHandleLeftWallClearancePx = 1;
const nodeSliderHandleRightWallClearancePx = 3;
const nodeSliderMinSkewExponent = 0.25;
const nodeSliderMaxSkewExponent = 4;
const nodeGraphAutoSmoothingDefaultSeconds = 0.016;

function clampNodeGraphAutoSmoothingSeconds(seconds) {
  const value = Number(seconds);
  if (!Number.isFinite(value)) {
    return nodeGraphAutoSmoothingDefaultSeconds;
  }
  return Math.max(0, value);
}

function nodeGraphSmoothingFrequencyFromSeconds(seconds) {
  const normalized = clampNodeGraphAutoSmoothingSeconds(seconds);
  return normalized <= 0 ? 0 : 1 / normalized;
}

function nodeGraphSmoothingSampleRate() {
  const rate = Number(nodeGraphMvp?.sampleRate);
  return Number.isFinite(rate) && rate > 0 ? rate : 44100;
}

function nodeGraphSmoothingSamplesFromSeconds(seconds) {
  return Math.max(0, Math.round(clampNodeGraphAutoSmoothingSeconds(seconds) * nodeGraphSmoothingSampleRate()));
}

function nodeGraphSmoothingSecondsFromSamples(samples) {
  const value = Number(samples);
  const safeSamples = Number.isFinite(value) ? Math.max(0, value) : nodeGraphSmoothingSamplesFromSeconds(nodeGraphAutoSmoothingDefaultSeconds);
  return clampNodeGraphAutoSmoothingSeconds(safeSamples / nodeGraphSmoothingSampleRate());
}

function nodeGraphDefaultSmoothingBlockSeconds() {
  return clampNodeGraphAutoSmoothingSeconds(128 / nodeGraphSmoothingSampleRate());
}

function nodeGraphNumericModifierReserved(event) {
  return Boolean(event?.shiftKey && (event.ctrlKey || event.metaKey) && event.altKey);
}

function nodeGraphNumericDragMultiplier(event) {
  if (nodeGraphNumericModifierReserved(event)) {
    return 0;
  }
  if (event?.shiftKey && (event.ctrlKey || event.metaKey)) {
    return 0.01;
  }
  if (event?.shiftKey || event?.ctrlKey || event?.metaKey) {
    return 0.1;
  }
  if (event?.altKey) {
    return 10;
  }
  return 1;
}

function clampNodeSliderValue(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function wrapNodeSliderValue(value, min, max) {
  const range = max - min;
  if (!Number.isFinite(range) || range <= 0) {
    return min;
  }
  return min + ((((value - min) % range) + range) % range);
}

function shortestNodeGraphWrapDelta(from, to, min, max) {
  const range = max - min;
  if (!Number.isFinite(range) || range <= 0) {
    return to - from;
  }
  let delta = to - from;
  if (delta > range / 2) {
    delta -= range;
  } else if (delta < -range / 2) {
    delta += range;
  }
  return delta;
}

const nodeGraphSmootherConvergenceEpsilon = 1e-7;

// Mirrors soemdsp::filter::SmootherBase::needsSmoothing() -- a settled/
// unmodulated parameter has outputBuffer already within epsilon of
// targetSignal, so the one-pole recompute can be skipped entirely instead
// of running (and reaching the same answer) every single sample forever.
function nodeGraphSmootherNeedsWork(smoother) {
  return Math.abs((smoother.outputBuffer ?? 0) - (smoother.targetSignal ?? 0)) > nodeGraphSmootherConvergenceEpsilon;
}

function nodeGraphOnePoleParameterLowpassSample(state, input, frequency, rate) {
  const safeRate = Math.max(1, Number(rate) || nodeGraphMvp?.sampleRate || 44100);
  const safeInput = Number.isFinite(Number(input)) ? Number(input) : state.outputBuffer || 0;
  const frequencyValue = Math.max(0, Number.isFinite(Number(frequency)) ? Number(frequency) : 0);
  const w = Math.min((Math.PI * 2) / safeRate, 0.000142475857) * frequencyValue;
  const a1 = Math.exp(-w);
  const b0 = 1 - a1;
  state.outputBuffer = b0 * safeInput + a1 * (Number(state.outputBuffer) || 0);
  return state.outputBuffer;
}

function normalizeNodeGraphSmootherSignal(value, metadata = {}) {
  if (typeof nodeGraphParameterValueToNormalizedSignal === "function") {
    return nodeGraphParameterValueToNormalizedSignal(value, metadata);
  }
  const min = Number(metadata.min);
  const max = Number(metadata.max);
  const range = max - min;
  if (!Number.isFinite(range) || range <= 0) {
    return 0;
  }
  return clampNodeSliderValue((Number(value) - min) / range, 0, 1);
}

function denormalizeNodeGraphSmootherSignal(signal, metadata = {}) {
  if (typeof nodeGraphNormalizedSignalToParameterValue === "function") {
    return nodeGraphNormalizedSignalToParameterValue(signal, metadata);
  }
  const min = Number(metadata.min);
  const max = Number(metadata.max);
  const range = max - min;
  return Number.isFinite(range) && range > 0 ? min + range * clampNodeSliderValue(signal, 0, 1) : signal;
}

// metadata.smoothingSeconds is human-readable seconds; this pipeline works
// in sample counts internally (0 = current block size, -1 = bypass). See
// the identical fix/rationale in node-live-audio-worklet.js's
// smoothingSecondsFromMetadata -- this is the offline/preview-render
// evaluator's parallel copy of that same logic, which had the same bug:
// Number(null) === 0 in JS silently turned every unconfigured parameter's
// "use the adaptive default" sentinel into an explicit "one block" value.
function nodeGraphParameterSmoothingSecondsFromMetadata(metadata = {}) {
  const raw = metadata?.smoothingSeconds;
  if (raw === null || raw === undefined) {
    return null;
  }
  const seconds = Number(raw);
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return 0;
  }
  const rate = Math.max(1, Number(nodeGraphMvp?.sampleRate) || 44100);
  return Math.round(seconds * rate);
}

function nodeGraphResolveSmoothingSecondsForSamples(smoothingSamples, frames, rate) {
  if (smoothingSamples === null) {
    return nodeGraphMvp?.live?.autoSmoothingSeconds;
  }
  if (smoothingSamples === -1) {
    return -1;
  }
  const safeRate = Math.max(1, Number(rate) || nodeGraphMvp?.sampleRate || 44100);
  const samples = smoothingSamples <= 0 ? Math.max(1, Number(frames) || 1) : smoothingSamples;
  return samples / safeRate;
}

function createNodeGraphParameterSmoother(initialValue, metadata = {}) {
  const value = Number(initialValue);
  const safeValue = Number.isFinite(value) ? value : 0;
  const signal = normalizeNodeGraphSmootherSignal(safeValue, metadata);
  return {
    current: safeValue,
    linearSmoothing: metadata.linearSmoothing !== false,
    max: Number.isFinite(Number(metadata.max)) ? Number(metadata.max) : 1,
    metadata,
    min: Number.isFinite(Number(metadata.min)) ? Number(metadata.min) : 0,
    smoothingSeconds: nodeGraphParameterSmoothingSecondsFromMetadata(metadata),
    outputBuffer: signal,
    targetSignal: signal,
    target: safeValue,
    lastFrame: -1,
    lastValue: safeValue,
    wraparound: Boolean(metadata.wraparound),
  };
}

function updateNodeGraphParameterSmoother(smoother, targetValue, metadata = {}) {
  const value = Number(targetValue);
  smoother.target = Number.isFinite(value) ? value : smoother.target;
  smoother.linearSmoothing = metadata.linearSmoothing !== false;
  smoother.max = Number.isFinite(Number(metadata.max)) ? Number(metadata.max) : smoother.max;
  smoother.metadata = metadata;
  smoother.min = Number.isFinite(Number(metadata.min)) ? Number(metadata.min) : smoother.min;
  smoother.smoothingSeconds = nodeGraphParameterSmoothingSecondsFromMetadata(metadata);
  smoother.targetSignal = normalizeNodeGraphSmootherSignal(smoother.target, metadata);
  smoother.wraparound = Boolean(metadata.wraparound);
  if (!smoother.linearSmoothing) {
    smoother.current = smoother.target;
    smoother.outputBuffer = smoother.targetSignal;
    smoother.lastValue = smoother.target;
  }
}

function readNodeGraphSmoothedParameter(smoother, frame, frames) {
  if (!smoother || !smoother.linearSmoothing) {
    return smoother?.target ?? 0;
  }
  if (smoother.lastFrame === frame) {
    return smoother.lastValue;
  }
  if (!nodeGraphSmootherNeedsWork(smoother)) {
    smoother.current = smoother.target;
    smoother.lastFrame = frame;
    smoother.lastValue = smoother.target;
    return smoother.target;
  }
  const resolvedSmoothingSeconds = nodeGraphResolveSmoothingSecondsForSamples(
    smoother.smoothingSeconds ?? null,
    frames,
    nodeGraphMvp?.sampleRate || 44100,
  );
  const smoothingSeconds = resolvedSmoothingSeconds === -1
    ? -1
    : clampNodeGraphAutoSmoothingSeconds(resolvedSmoothingSeconds);
  if (smoothingSeconds <= 0) {
    smoother.current = smoother.target;
    smoother.outputBuffer = smoother.targetSignal;
    smoother.lastFrame = frame;
    smoother.lastValue = smoother.target;
    return smoother.target;
  }
  const signal = nodeGraphOnePoleParameterLowpassSample(
    smoother,
    smoother.targetSignal,
    nodeGraphSmoothingFrequencyFromSeconds(smoothingSeconds),
    nodeGraphMvp?.sampleRate || 44100,
  );
  const value = denormalizeNodeGraphSmootherSignal(signal, smoother.metadata);
  smoother.current = value;
  smoother.lastFrame = frame;
  smoother.lastValue = value;
  return value;
}

function finishNodeGraphParameterSmoothing(smoothers) {
  for (const smoother of smoothers.values()) {
    if (!smoother.linearSmoothing) {
      smoother.current = smoother.wraparound
        ? wrapNodeSliderValue(smoother.target, smoother.min, smoother.max)
        : smoother.target;
      continue;
    }
    smoother.current = smoother.lastValue ?? smoother.current;
    smoother.lastFrame = -1;
  }
}

function normalizeNodeSliderValue(slider, value, min = Number(slider.min), max = Number(slider.max)) {
  if (!Number.isFinite(value)) {
    return Number.isFinite(min) ? min : 0;
  }
  return nodeSliderShouldWraparound(slider)
    ? wrapNodeSliderValue(value, min, max)
    : clampNodeSliderValue(value, min, max);
}

function normalizedNodeSliderMid(slider) {
  const min = Number(slider.min);
  const max = Number(slider.max);
  const mid = clampNodeSliderValue(Number(slider.dataset.mid), min, max);
  const range = max - min;
  if (!Number.isFinite(range) || range <= 0) {
    return 0.5;
  }

  return clampNodeSliderValue((mid - min) / range, 0.000001, 0.999999);
}

function nodeSliderSkewExponent(slider) {
  if (nodeSliderCurve(slider) !== "skew") {
    return 1;
  }
  const exponent = Math.log(normalizedNodeSliderMid(slider)) / Math.log(0.5);
  return clampNodeSliderValue(exponent, nodeSliderMinSkewExponent, nodeSliderMaxSkewExponent);
}

function nodeSliderEdgeCurvePower(slider) {
  if (nodeSliderCurve(slider) !== "edges") {
    return 1;
  }
  return 1 + Math.abs(nodeSliderCurveAmount(slider)) * 7;
}

function nodeSliderCurveValueFromTravel(slider, travel) {
  const normalizedTravel = normalizeNodeSliderTravel(slider, travel);
  const curve = nodeSliderCurve(slider);
  if (curve === "edges") {
    const amount = nodeSliderCurveAmount(slider);
    const power = nodeSliderEdgeCurvePower(slider);
    if (amount >= 0) {
      if (normalizedTravel <= 0.5) {
        return 0.5 * (normalizedTravel * 2) ** power;
      }
      return 1 - 0.5 * (2 - normalizedTravel * 2) ** power;
    }
    if (normalizedTravel <= 0.5) {
      return 0.5 * (1 - (1 - normalizedTravel * 2) ** power);
    }
    return 0.5 + 0.5 * ((normalizedTravel - 0.5) * 2) ** power;
  }
  return normalizedTravel ** nodeSliderSkewExponent(slider);
}

function nodeSliderCurveTravelFromValue(slider, normalizedValue) {
  const value = clampNodeSliderValue(normalizedValue, 0, 1);
  const curve = nodeSliderCurve(slider);
  if (curve === "edges") {
    const amount = nodeSliderCurveAmount(slider);
    const power = nodeSliderEdgeCurvePower(slider);
    if (amount >= 0) {
      if (value <= 0.5) {
        return 0.5 * (value * 2) ** (1 / power);
      }
      return 1 - 0.5 * (2 - value * 2) ** (1 / power);
    }
    if (value <= 0.5) {
      return 0.5 * (1 - (1 - value * 2) ** (1 / power));
    }
    return 0.5 + 0.5 * ((value - 0.5) * 2) ** (1 / power);
  }
  return value ** (1 / nodeSliderSkewExponent(slider));
}

function normalizeNodeSliderTravel(slider, travel) {
  const number = Number(travel);
  if (!Number.isFinite(number)) {
    return 0;
  }
  return nodeSliderShouldWraparound(slider)
    ? wrapNodeSliderValue(number, 0, 1)
    : clampNodeSliderValue(number, 0, 1);
}

function nodeSliderValueFromTravel(slider, travel) {
  const min = Number(slider.min);
  const max = Number(slider.max);
  const range = max - min;
  if (!Number.isFinite(range) || range <= 0) {
    return min;
  }

  return min + range * nodeSliderCurveValueFromTravel(slider, travel);
}

function nodeSliderValueFromPointerTravel(slider, travel) {
  const min = Number(slider.min);
  const max = Number(slider.max);
  const range = max - min;
  if (!Number.isFinite(range) || range <= 0) {
    return min;
  }

  return min + range * nodeSliderCurveValueFromTravel(slider, travel);
}

function nodeSliderValueFromRelativeTravel(slider, travel) {
  const min = Number(slider.min);
  const max = Number(slider.max);
  const range = max - min;
  const numericTravel = Number(travel);
  if (!Number.isFinite(range) || range <= 0 || !Number.isFinite(numericTravel)) {
    return min;
  }
  if (numericTravel < 0 && slider.dataset.unboundedMin === "true") {
    return min + range * numericTravel;
  }
  if (numericTravel > 1 && slider.dataset.unboundedMax === "true") {
    return max + range * (numericTravel - 1);
  }
  return nodeSliderValueFromPointerTravel(slider, numericTravel);
}

function nodeSliderTravelFromValue(slider, value) {
  const min = Number(slider.min);
  const max = Number(slider.max);
  const range = max - min;
  if (!Number.isFinite(range) || range <= 0) {
    return 0;
  }

  const normalizedValue = clampNodeSliderValue((value - min) / range, 0, 1);
  return nodeSliderCurveTravelFromValue(slider, normalizedValue);
}

function nodeSliderElementLayoutWidth(element) {
  const width = Number(element?.clientWidth || element?.offsetWidth || 0);
  if (Number.isFinite(width) && width > 0) {
    return width;
  }
  const rectWidth = Number(element?.getBoundingClientRect?.().width) || 0;
  const zoom = Math.max(0.01, Number(nodeGraphMvp?.zoom) || 1);
  return Math.max(0, rectWidth / zoom);
}

function nodeSliderElementLayoutHeight(element) {
  const height = Number(element?.clientHeight || element?.offsetHeight || 0);
  if (Number.isFinite(height) && height > 0) {
    return height;
  }
  const rectHeight = Number(element?.getBoundingClientRect?.().height) || 0;
  const zoom = Math.max(0.01, Number(nodeGraphMvp?.zoom) || 1);
  return Math.max(0, rectHeight / zoom);
}

function nodeSliderElementVisualScale(element) {
  const layoutWidth = nodeSliderElementLayoutWidth(element);
  const rectWidth = Number(element?.getBoundingClientRect?.().width) || 0;
  if (!Number.isFinite(layoutWidth) || !Number.isFinite(rectWidth) || layoutWidth <= 0 || rectWidth <= 0) {
    return 1;
  }
  return Math.max(0.01, rectWidth / layoutWidth);
}

function nodeSliderVisualLane(surface, slider) {
  const width = nodeSliderElementLayoutWidth(surface);
  const handleHalfWidth = Math.min(nodeSliderHandleHalfWidthPx, width / 2);
  const maxClearance = Math.max(0, width / 2 - handleHalfWidth);
  const leftClearance = nodeSliderShouldWraparound(slider)
    ? 0
    : Math.min(nodeSliderHandleLeftWallClearancePx, maxClearance);
  const rightClearance = nodeSliderShouldWraparound(slider)
    ? 0
    : Math.min(nodeSliderHandleRightWallClearancePx, maxClearance);
  const leftInset = nodeSliderShouldWraparound(slider) ? 0 : handleHalfWidth + leftClearance;
  const rightInset = nodeSliderShouldWraparound(slider) ? 0 : handleHalfWidth + rightClearance;
  return {
    handleHalfWidth,
    inset: leftInset,
    leftInset,
    rightInset,
    travelWidth: Math.max(1, width - leftInset - rightInset),
    width: Math.max(1, width),
  };
}

function nodeSliderVisualCenterFromTravel(slider, surface, travel) {
  const lane = nodeSliderVisualLane(surface, slider);
  const normalizedTravel = normalizeNodeSliderTravel(slider, travel);
  return lane.inset + normalizedTravel * lane.travelWidth;
}

function nodeSliderHandleRangeFromTravel(slider, surface, travel) {
  const lane = nodeSliderVisualLane(surface, slider);
  const center = nodeSliderVisualCenterFromTravel(slider, surface, travel);
  return {
    center,
    end: center + lane.handleHalfWidth,
    handleHalfWidth: lane.handleHalfWidth,
    start: center - lane.handleHalfWidth,
    width: lane.width,
  };
}

function nodeSliderTravelFromPointer(slider, surface, clientX) {
  const rect = surface.getBoundingClientRect();
  const lane = nodeSliderVisualLane(surface, slider);
  const scale = nodeSliderElementVisualScale(surface);
  const x = (clientX - rect.left) / scale;
  return normalizeNodeSliderTravel(slider, (x - lane.inset) / lane.travelWidth);
}

function setNodeSliderMetadata(slider, metadata) {
  const control = slider.closest(".node-parameter-control");
  const alias = normalizeNodeGraphPatchMetadataAlias(metadata.alias);
  slider.dataset.alias = alias;
  if (control) {
    control.dataset.paramLabel = alias || control.dataset.defaultParamLabel || control.dataset.paramLabel || "";
    control.setAttribute("aria-label", control.dataset.paramLabel || slider.dataset.param || slider.id);
  }
  slider.min = String(metadata.min);
  slider.max = String(metadata.max);
  slider.dataset.mid = String(clampNodeSliderValue(metadata.mid, metadata.min, metadata.max));
  slider.dataset.default = String(
    clampNodeSliderValue(metadata.def, metadata.min, metadata.max),
  );
  slider.step = metadata.step > 0 ? String(metadata.step) : "any";
  slider.dataset.step = slider.step;
  slider.dataset.kind = metadata.kind || "decimal";
  slider.dataset.maxDigits = String(
    normalizeNodeGraphMetadataMaxDigits(metadata.maxDigits, metadata.kind),
  );
  slider.dataset.unit = metadata.unit ?? "";
  slider.dataset.tooltip = metadata.tooltip ?? "";
  slider.dataset.choices = formatNodeMetadataChoices(metadata.choices || []);
  slider.dataset.displayChoices = metadata.displayChoices ? "true" : "false";
  slider.dataset.divideChoicesVisibly = metadata.divideChoicesVisibly ? "true" : "false";
  slider.dataset.linearSmoothing = metadata.linearSmoothing ? "true" : "false";
  slider.dataset.smoothingSeconds = Number.isFinite(Number(metadata.smoothingSeconds)) && Number(metadata.smoothingSeconds) >= 0
    ? String(metadata.smoothingSeconds)
    : "";
  slider.dataset.sliderCurve = normalizeNodeSliderCurve(metadata.sliderCurve, metadata.nonlinearSlider);
  slider.dataset.curveAmount = String(normalizeNodeSliderCurveAmount(metadata.curveAmount));
  slider.dataset.nonlinearSlider = slider.dataset.sliderCurve === "linear" ? "false" : "true";
  slider.dataset.showSign = metadata.showSign ? "true" : "false";
  slider.dataset.unboundedMax = metadata.unboundedMax ? "true" : "false";
  slider.dataset.unboundedMin = metadata.unboundedMin ? "true" : "false";
  slider.dataset.wraparound = metadata.wraparound ? "true" : "false";
  slider.value = String(normalizeNodeSliderValue(slider, Number(slider.value), metadata.min, metadata.max));
  syncNodeSliderReadout(slider);
}

function quantizeNodeSliderDragValue(slider, value) {
  const step = Number(slider.dataset.step);
  if (!Number.isFinite(step) || step <= 0) {
    return value;
  }

  const min = Number(slider.min);
  const origin = Number.isFinite(min) ? min : 0;
  return origin + Math.round((value - origin) / step) * step;
}
