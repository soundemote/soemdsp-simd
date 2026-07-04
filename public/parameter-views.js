function renderParameterTimeline(manifest) {
  const timeline = document.getElementById("parameterTimeline");
  const status = document.getElementById("parameterTimelineStatus");
  timeline.replaceChildren();

  const phases = manifest?.phases || [];
  const totalFrames = Number(manifest?.wav?.frames || 0);
  const spans = buildPhaseSpans(phases, totalFrames);
  const rows = parameterTimelineRows(manifest);
  if (!phases.length || totalFrames <= 0 || !rows.length) {
    status.textContent = "Check";
    status.className = "pill warn";
    updateParameterTimelinePlayhead(null);
    return;
  }

  for (const [name, values] of rows) {
    const track = document.createElement("div");
    track.className = "parameter-track";

    const label = document.createElement("div");
    label.className = "parameter-track-label";
    label.textContent = name;

    const rail = document.createElement("div");
    rail.className = "parameter-track-rail";

    for (const [index, phase] of phases.entries()) {
      const frames = Number(phase.samplesProcessed || 0);
      const span = spans[index] || { startFrame: 0, endFrame: frames };
      const valueText = manifestValueText(values[phase.name]) || "missing";
      const startTime = formatSeconds(span.startFrame / manifest.wav.sampleRate);
      const endTime = formatSeconds(span.endFrame / manifest.wav.sampleRate);
      const segmentLabel =
        `Parameter ${name} ${phase.name || "phase"} value ${valueText} ` +
        `from frame ${span.startFrame} to ${span.endFrame}`;
      const segment = document.createElement("div");
      segment.className = "parameter-segment";
      segment.dataset.phaseName = phase.name || "";
      segment.dataset.parameterName = name;
      segment.dataset.parameterValue = valueText;
      segment.dataset.startFrame = String(span.startFrame);
      segment.dataset.endFrame = String(span.endFrame);
      segment.dataset.startTime = startTime;
      segment.dataset.endTime = endTime;
      segment.setAttribute("aria-label", segmentLabel);
      segment.setAttribute("role", "group");
      segment.title = nodeGraphTooltipText("legacyEvidence.timelineSegment", {
        end: endTime,
        label: segmentLabel,
        start: startTime,
      });
      segment.style.flexBasis = `${Math.max(1, (frames / totalFrames) * 100)}%`;
      segment.addEventListener("pointermove", probeParameterTimelineSegment);
      segment.addEventListener("pointerleave", clearParameterTimelineProbe);

      const phaseLabel = document.createElement("span");
      phaseLabel.textContent = phase.name || "phase";

      const value = document.createElement("strong");
      value.textContent = valueText;

      segment.append(phaseLabel, value);
      rail.append(segment);
    }

    track.append(label, rail);
    timeline.append(track);
  }

  const marker = document.createElement("div");
  marker.id = "parameterTimelinePlayhead";
  marker.className = "parameter-timeline-marker";
  timeline.append(marker);
  const probeMarker = document.createElement("div");
  probeMarker.id = "parameterTimelineProbeMarker";
  probeMarker.className = "parameter-timeline-marker probe";
  probeMarker.hidden = true;
  timeline.append(probeMarker);
  status.textContent = `${rows.length} params`;
  status.className = "pill good";
  updateParameterTimelinePlayhead(activeWaveformRegion());
  renderParameterTimelineProbe();
}

function renderUnavailableParameterTimeline() {
  const timeline = document.getElementById("parameterTimeline");
  timeline.replaceChildren();

  const track = document.createElement("div");
  track.className = "parameter-track";

  const label = document.createElement("div");
  label.className = "parameter-track-label";
  label.textContent = "resync";

  const rail = document.createElement("div");
  rail.className = "parameter-track-rail";

  const segment = document.createElement("div");
  segment.className = "parameter-segment warn-row";
  segment.dataset.phaseName = "unavailable";
  segment.dataset.parameterName = "resync";
  segment.dataset.parameterValue = "manifest required";
  segment.dataset.startFrame = "none";
  segment.dataset.endFrame = "none";
  segment.dataset.startTime = "unavailable";
  segment.dataset.endTime = "unavailable";
  segment.setAttribute("aria-label", "Parameter resync unavailable: manifest required");
  segment.setAttribute("role", "group");
  segment.title = nodeGraphTooltipText("legacyEvidence.parameterResyncUnavailable");

  const phase = document.createElement("span");
  phase.textContent = "unavailable";

  const value = document.createElement("strong");
  value.textContent = "manifest required";

  segment.append(phase, value);
  rail.append(segment);
  track.append(label, rail);
  timeline.append(track);
}
