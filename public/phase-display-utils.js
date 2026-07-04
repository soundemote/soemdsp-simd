function formatPhaseRange(span, sampleRate) {
  if (!sampleRate) {
    return "unavailable";
  }

  return `${formatSeconds(span.startFrame / sampleRate)}-${formatSeconds(
    span.endFrame / sampleRate,
  )}`;
}

function phaseDisplayRange(phase, fallbackStartFrame, totalFrames) {
  const frames = Number(phase.samplesProcessed || 0);
  const explicitStart = Number(phase.startFrame);
  const explicitEnd = Number(phase.endFrame);
  const hasExplicitRange =
    Number.isFinite(explicitStart) &&
    Number.isFinite(explicitEnd) &&
    explicitStart >= 0 &&
    explicitEnd >= explicitStart;
  const startFrame = Math.min(
    totalFrames,
    hasExplicitRange ? explicitStart : fallbackStartFrame,
  );
  const endFrame = Math.min(
    totalFrames,
    hasExplicitRange ? explicitEnd : fallbackStartFrame + frames,
  );

  return {
    endFrame,
    frames: Math.max(0, endFrame - startFrame),
    startFrame,
  };
}

function buildPhaseRegions(phases, totalFrames) {
  let startFrame = 0;
  return phases.map((phase) => {
    const range = phaseDisplayRange(phase, startFrame, totalFrames);
    const region = {
      endFrame: range.endFrame,
      name: phase.name || "phase",
      startFrame: range.startFrame,
    };
    startFrame = range.endFrame;
    return region;
  });
}

function buildPhaseSpans(phases, totalFrames) {
  let startFrame = 0;
  return phases.map((phase) => {
    const span = phaseDisplayRange(phase, startFrame, totalFrames);
    startFrame = span.endFrame;
    return span;
  });
}

function phaseFrameTotal(phases) {
  return phases.reduce(
    (total, phase) => total + Number(phase.samplesProcessed || 0),
    0,
  );
}
