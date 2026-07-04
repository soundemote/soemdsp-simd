function signalPlotLagFrames(waveform) {
  return Math.max(1, Math.round((waveform.sampleRate * state.signalLagMs) / 1000));
}

function signalPlotWindowFrameRange(waveform, drawableFrames) {
  if (state.signalPlotWindow === "full") {
    return {
      endFrame: drawableFrames,
      startFrame: 0,
    };
  }

  const windowFrames = Math.max(
    1,
    Math.round((waveform.sampleRate * state.signalPlotWindowMs) / 1000),
  );
  const startFrame = Math.max(
    0,
    Math.min(drawableFrames, state.playheadFrame - Math.floor(windowFrames / 2)),
  );
  const endFrame = Math.max(
    startFrame,
    Math.min(drawableFrames, startFrame + windowFrames),
  );

  return {
    endFrame,
    startFrame,
  };
}

function signalPlotWindowName(waveform, drawableFrames) {
  if (state.signalPlotWindow === "full") {
    return "full";
  }

  const range = signalPlotWindowFrameRange(waveform, drawableFrames);
  return `${formatSeconds(range.startFrame / waveform.sampleRate)}-${formatSeconds(
    range.endFrame / waveform.sampleRate,
  )}`;
}

function signalPlotRegions(waveform, drawableFrames) {
  const regions = waveform.regions?.length
    ? waveform.regions
    : [{ name: "all", startFrame: 0, endFrame: drawableFrames }];
  const focusedRegions =
    state.signalPhaseFocusIndex === null
      ? regions
      : [regions[state.signalPhaseFocusIndex]].filter(Boolean);
  const windowRange = signalPlotWindowFrameRange(waveform, drawableFrames);

  return focusedRegions
    .map((region) => ({
      ...region,
      endFrame: Math.min(region.endFrame, windowRange.endFrame),
      startFrame: Math.max(region.startFrame, windowRange.startFrame),
    }))
    .filter((region) => region.endFrame > region.startFrame);
}

function signalPlotFocusName(waveform) {
  if (!waveform || state.signalPhaseFocusIndex === null) {
    return "all";
  }

  return waveform.regions?.[state.signalPhaseFocusIndex]?.name || "all";
}

function restoreSignalPlotFocusIndex() {
  if (state.signalPhaseFocusName === "all") {
    state.signalPhaseFocusIndex = null;
    return;
  }

  const index = (state.waveform?.regions || []).findIndex(
    (region) => region.name === state.signalPhaseFocusName,
  );
  state.signalPhaseFocusIndex = index >= 0 ? index : null;
}

function signalPlotPointCount(waveform, drawableFrames) {
  return signalPlotRegions(waveform, drawableFrames).reduce((total, region) => {
    const startFrame = Math.max(0, Math.min(drawableFrames, region.startFrame));
    const endFrame = Math.max(startFrame, Math.min(drawableFrames, region.endFrame));
    return total + Math.max(0, endFrame - startFrame);
  }, 0);
}

function signalPlotFocusStats(waveform, drawableFrames) {
  const regions = signalPlotRegions(waveform, drawableFrames);
  let max = -Infinity;
  let min = Infinity;
  let squareSum = 0;
  let count = 0;

  for (const region of regions) {
    const startFrame = Math.max(0, Math.min(drawableFrames, region.startFrame));
    const endFrame = Math.max(startFrame, Math.min(drawableFrames, region.endFrame));
    for (let frame = startFrame; frame < endFrame; frame += 1) {
      const sample = waveform.samples[frame] || 0;
      max = Math.max(max, sample);
      min = Math.min(min, sample);
      squareSum += sample * sample;
      count += 1;
    }
  }

  if (count === 0) {
    return {
      max: 0,
      min: 0,
      peak: 0,
      rms: 0,
    };
  }

  return {
    max,
    min,
    peak: Math.max(Math.abs(min), Math.abs(max)),
    rms: Math.sqrt(squareSum / count),
  };
}
