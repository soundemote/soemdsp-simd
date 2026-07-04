function setInspectionCursorSource(sourceName, mode) {
  const source = document.getElementById("inspectionCursorSource");
  const value = `source ${sourceName}`;
  source.textContent = value;
  source.className = `pill inspection-source ${mode}`;
  labelInspectionCursorPill(source, "inspection source", value, mode);
}

function setInspectionCursorDelta(deltaFrame, sampleRate) {
  const delta = document.getElementById("inspectionCursorDelta");
  const stateName = deltaFrame === null ? inspectionModes.none : inspectionModes.hover;
  const value = `delta ${formatInspectionDelta(deltaFrame, sampleRate)}`;
  delta.textContent = value;
  delta.className = `pill inspection-delta ${stateName}`;
  labelInspectionCursorPill(delta, "inspection delta", value, stateName);
}

function setInspectionCursorAudio(time, duration) {
  const audio = document.getElementById("inspectionCursorAudio");
  const value = `audio ${formatSeconds(Number.isFinite(time) ? time : 0)} / ${formatAudioDuration(duration)}`;
  audio.textContent = value;
  labelInspectionCursorPill(
    audio,
    "inspection audio",
    value,
    Number.isFinite(duration) && duration > 0 ? "known" : "unknown",
  );
}

function setInspectionCursorPlayback(audio) {
  const playback = document.getElementById("inspectionCursorPlayback");
  const stateName = audio?.ended ? "ended" : audio?.paused === false ? "playing" : "paused";
  const value = `playback ${stateName}`;
  playback.textContent = value;
  playback.className = `pill inspection-playback ${stateName}`;
  labelInspectionCursorPill(playback, "inspection playback", value, stateName);
}

function setInspectionCursorView(followAudio) {
  const view = document.getElementById("inspectionCursorView");
  const stateName = followAudio ? "follow" : "free";
  const value = `view ${stateName}`;
  view.textContent = value;
  view.className = `pill inspection-view ${stateName}`;
  labelInspectionCursorPill(view, "inspection view", value, stateName);
}

function setInspectionCursorPreview(active) {
  const preview = document.getElementById("inspectionCursorPreview");
  const stateName = active ? "active" : "idle";
  const value = active ? "preview only" : "preview idle";
  preview.textContent = value;
  preview.className = `pill inspection-preview ${stateName}`;
  labelInspectionCursorPill(preview, "inspection preview", value, stateName);
}

function setInspectionCursorSeek(sourceName) {
  const seek = document.getElementById("inspectionCursorSeek");
  const stateName = sourceName ? "active" : "idle";
  const value = sourceName ? `seek ${sourceName}` : "seek idle";
  seek.textContent = value;
  seek.className = `pill inspection-seek ${stateName}`;
  labelInspectionCursorPill(seek, "inspection seek", value, stateName);
}

function setInspectionCursorSeekTarget(region, frame, sampleRate) {
  const target = document.getElementById("inspectionCursorSeekTarget");
  const hasTarget = region && frame !== null && Number.isFinite(sampleRate) && sampleRate > 0;
  const value = hasTarget
    ? `seek target ${region.name} / ${formatSeconds(frame / sampleRate)} / frame ${frame}`
    : "seek target none";
  target.textContent = value;
  target.className = `pill inspection-seek-target ${hasTarget ? "active" : "none"}`;
  labelInspectionCursorPill(
    target,
    "inspection seek target",
    value,
    hasTarget ? "active" : "none",
  );
}

function setInspectionCursorSeekSync(match) {
  const sync = document.getElementById("inspectionCursorSeekSync");
  const value =
    match === "aligned"
      ? "seek aligned"
      : match === "diverged"
        ? "seek drift"
        : "seek sync idle";
  sync.textContent = value;
  sync.className = `pill inspection-seek-sync ${match}`;
  labelInspectionCursorPill(sync, "inspection seek sync", value, match);
}

function setInspectionCursorTarget(region, frame, sampleRate) {
  const target = document.getElementById("inspectionCursorTarget");
  const hasTarget = region && frame !== null && Number.isFinite(sampleRate) && sampleRate > 0;
  const value = hasTarget
    ? `target ${region.name} / ${formatSeconds(frame / sampleRate)} / frame ${frame}`
    : "target none";
  target.textContent = value;
  target.className = `pill inspection-target ${hasTarget ? "active" : "none"}`;
  labelInspectionCursorPill(target, "inspection target", value, hasTarget ? "active" : "none");
}

function setInspectionCursorTransport(region, frame, sampleRate) {
  const transport = document.getElementById("inspectionCursorTransport");
  const hasTransport = region && frame !== null && Number.isFinite(sampleRate) && sampleRate > 0;
  const value = hasTransport
    ? `transport ${region.name} / ${formatSeconds(frame / sampleRate)} / frame ${frame}`
    : "transport none";
  transport.textContent = value;
  transport.className = `pill inspection-transport ${hasTransport ? "active" : "none"}`;
  labelInspectionCursorPill(
    transport,
    "inspection transport",
    value,
    hasTransport ? "active" : "none",
  );
}

function setInspectionCursorDivergence(transportRegion, targetRegion) {
  const divergence = document.getElementById("inspectionCursorDivergence");
  const diverged = Boolean(
    transportRegion &&
      targetRegion &&
      transportRegion.name !== targetRegion.name,
  );
  const value = diverged
    ? `phase diverged ${transportRegion.name} -> ${targetRegion.name}`
    : "phase aligned";
  divergence.textContent = value;
  divergence.className = `pill inspection-divergence ${diverged ? "diverged" : "aligned"}`;
  labelInspectionCursorPill(
    divergence,
    "inspection divergence",
    value,
    diverged ? "diverged" : "aligned",
  );
}

function probeSourceText() {
  const source = currentProbeSource();
  return source === inspectionModes.probe ? inspectionModes.probe : `${inspectionModes.probe} ${source}`;
}

function currentProbeSource() {
  return state.waveformProbeSource || inspectionModes.probe;
}

function formatProbeFrame(frame, waveform, region = waveformRegionAtFrameFor(waveform, frame)) {
  return `${formatSeconds(frame / waveform.sampleRate)} / frame ${frame} / ${
    region?.name || "phase"
  }`;
}

function probeFrameLabelsReady() {
  const waveform = state.waveform;
  if (!waveform || !Number.isFinite(waveform.sampleRate) || waveform.sampleRate <= 0) {
    return false;
  }

  const label = formatProbeFrame(0, waveform);
  return (
    label.includes("0.000s") &&
    label.includes("frame 0") &&
    label.includes(waveformRegionAtFrameFor(waveform, 0)?.name || "phase")
  );
}

function setProbePillMetadata(probe, source, frame, title) {
  probe.dataset.probeSource = source;
  probe.dataset.probeFrame = frame === null || frame === undefined ? "none" : String(frame);
  probe.title = title;
}

function resetProbePill(id, text, title) {
  const probe = document.getElementById(id);
  if (!probe) {
    return;
  }

  probe.textContent = text;
  setProbePillMetadata(probe, inspectionModes.none, null, title);
}

function resetIdleProbePill(id, title) {
  resetProbePill(id, inspectionModes.probe, title);
}
