function parameterTimelineSegmentsLabeled() {
  const segments = [...document.querySelectorAll("#parameterTimeline .parameter-segment")];
  return (
    segments.length > 0 &&
    segments.every((segment) => {
      const label = segment.getAttribute("aria-label") || "";
      return (
        segment.dataset.phaseName !== undefined &&
        segment.dataset.parameterName !== undefined &&
        segment.dataset.parameterValue !== undefined &&
        segment.dataset.startFrame !== undefined &&
        segment.dataset.endFrame !== undefined &&
        segment.dataset.startTime !== undefined &&
        segment.dataset.endTime !== undefined &&
        label.startsWith("Parameter ") &&
        label.includes(" from frame ") &&
        label.includes(" to ") &&
        segment.getAttribute("role") === "group" &&
        segment.title.startsWith(label)
      );
    })
  );
}

function parameterTimelinePreviewAvailable() {
  return parameterTimelineSegmentsLabeled();
}

function phaseListItemsLabeled() {
  const items = [...document.querySelectorAll("#phaseList .phase")];
  return (
    items.length > 0 &&
    items.every((item) => {
      const label = item.getAttribute("aria-label") || "";
      return (
        item.dataset.phaseIndex !== undefined &&
        item.dataset.phaseName !== undefined &&
        item.dataset.startFrame !== undefined &&
        item.dataset.endFrame !== undefined &&
        item.dataset.startTime !== undefined &&
        item.dataset.endTime !== undefined &&
        item.dataset.duration !== undefined &&
        item.dataset.wavShare !== undefined &&
        label.startsWith("Phase ") &&
        item.getAttribute("role") === "group" &&
        item.title.startsWith(label)
      );
    })
  );
}

function phasePreviewTargetAvailable() {
  return phaseListItemsLabeled() && phaseAudioStatsItemsLabeled();
}

function phaseAudioStatsItemsLabeled() {
  const items = [...document.querySelectorAll("#phaseAudioStats .phase-stat")];
  return (
    items.length > 0 &&
    items.every((item) => {
      const label = item.getAttribute("aria-label") || "";
      return (
        item.dataset.phaseName !== undefined &&
        item.dataset.startFrame !== undefined &&
        item.dataset.endFrame !== undefined &&
        item.dataset.startTime !== undefined &&
        item.dataset.endTime !== undefined &&
        item.dataset.targetFrequency !== undefined &&
        item.dataset.measuredFrequency !== undefined &&
        item.dataset.targetAmplitude !== undefined &&
        item.dataset.peak !== undefined &&
        item.dataset.rms !== undefined &&
        item.dataset.producerMatch !== undefined &&
        label.startsWith("Phase audio stats ") &&
        item.getAttribute("role") === "group" &&
        item.title.startsWith(label)
      );
    })
  );
}
