function renderInspectionCursor() {
  const cursor = document.getElementById("inspectionCursor");
  const waveform = state.waveform;
  if (!waveform) {
    setStatus("inspectionCursorStatus", "Check", false);
    setInspectionCursorSource(inspectionModes.none, inspectionModes.none);
    setInspectionCursorDelta(null, 1);
    setInspectionCursorPreview(false);
    setInspectionCursorSeek(null);
    setInspectionCursorSeekTarget(null, null, 1);
    setInspectionCursorSeekSync("none");
    setInspectionCursorTransport(null, null, 1);
    setInspectionCursorTarget(null, null, 1);
    setInspectionCursorDivergence(null, null);
    renderKeyValue(cursor, [
      ["transport frame", "0"],
      ["transport time", "0.000s"],
      ["transport phase", "phase"],
      ["last seek source", "none"],
      ["last seek mode", "none"],
      ["last seek frame", "none"],
      ["last seek time", "none"],
      ["last seek phase", "none"],
      ["last seek transport match", "none"],
      ["last seek transport delta", "none"],
      ["last seek hover match", "none"],
      ["last seek hover delta", "none"],
      ["hover source", "none"],
      ["hover frame", "none"],
      ["hover signal", "none"],
    ]);
    labelInspectionCursorSurface(cursor, "unavailable", "check");
    return;
  }

  const transportFrame = clampFrame(state.playheadFrame, waveform);
  const transportSample =
    waveform.samples[Math.max(0, Math.min(waveform.samples.length - 1, transportFrame))] || 0;
  const transportRegion = waveformRegionAtFrame(transportFrame);
  const hoverFrame =
    state.waveformProbeFrame ??
    state.signalPlotProbe?.nearest?.frame ??
    null;
  const hoverRegion = hoverFrame !== null ? waveformRegionAtFrame(hoverFrame) : null;
  const hoverSample =
    hoverFrame !== null
      ? waveform.samples[Math.max(0, Math.min(waveform.samples.length - 1, hoverFrame))] || 0
      : null;
  const hoverSignal = hoverFrame !== null ? signalPlotProbeAtFrame(hoverFrame) : null;
  const hoverEnvelope = hoverFrame !== null ? levelEnvelopeWindowAtFrame(hoverFrame) : null;
  const hoverFrequency = activeParameterValue("frequency", hoverRegion);
  const hoverAmplitude = activeParameterValue("amplitude", hoverRegion);
  const hoverSource =
    hoverFrame === null
      ? inspectionModes.transport
      : state.waveformProbeSource || inspectionModes.probe;
  const hoverDeltaFrame = hoverFrame === null ? null : hoverFrame - transportFrame;
  const lastSeekFrame =
    state.lastSeekFrame === null ? null : clampFrame(state.lastSeekFrame, waveform);
  const lastSeekRegion =
    lastSeekFrame === null ? null : waveformRegionAtFrame(lastSeekFrame);
  const lastSeekTransportDeltaFrame =
    lastSeekFrame === null ? null : transportFrame - lastSeekFrame;
  const lastSeekTransportMatch =
    lastSeekTransportDeltaFrame === null
      ? "none"
      : lastSeekTransportDeltaFrame === 0
        ? "aligned"
        : "diverged";
  const lastSeekHoverDeltaFrame =
    lastSeekFrame === null || hoverFrame === null ? null : hoverFrame - lastSeekFrame;
  const lastSeekHoverMatch =
    lastSeekHoverDeltaFrame === null
      ? "none"
      : lastSeekHoverDeltaFrame === 0
        ? "aligned"
        : "diverged";

  setStatus("inspectionCursorStatus", hoverFrame === null ? "Transport" : "Hover", true);
  setInspectionCursorSource(
    hoverSource,
    hoverFrame === null ? inspectionModes.transport : inspectionModes.hover,
  );
  setInspectionCursorDelta(hoverDeltaFrame, waveform.sampleRate);
  setInspectionCursorPreview(hoverFrame !== null);
  setInspectionCursorSeek(state.lastSeekSource);
  setInspectionCursorSeekTarget(lastSeekRegion, lastSeekFrame, waveform.sampleRate);
  setInspectionCursorSeekSync(lastSeekTransportMatch);
  setInspectionCursorTransport(transportRegion, transportFrame, waveform.sampleRate);
  setInspectionCursorTarget(hoverRegion, hoverFrame, waveform.sampleRate);
  setInspectionCursorDivergence(transportRegion, hoverRegion);
  renderKeyValue(cursor, [
    ["transport frame", String(transportFrame)],
    ["transport time", formatSeconds(transportFrame / waveform.sampleRate)],
    ["transport phase", transportRegion?.name || "phase"],
    ["transport sample", formatCompactNumber(transportSample)],
    ["last seek source", state.lastSeekSource || "none"],
    [
      "last seek mode",
      state.lastSeekFollowAudio === null
        ? "none"
        : state.lastSeekFollowAudio
          ? "follow audio"
          : "free view",
    ],
    ["last seek frame", lastSeekFrame === null ? "none" : String(lastSeekFrame)],
    [
      "last seek time",
      lastSeekFrame === null ? "none" : formatSeconds(lastSeekFrame / waveform.sampleRate),
    ],
    ["last seek phase", lastSeekRegion?.name || "none"],
    ["last seek transport match", lastSeekTransportMatch],
    [
      "last seek transport delta",
      formatInspectionDelta(lastSeekTransportDeltaFrame, waveform.sampleRate),
    ],
    ["last seek hover match", lastSeekHoverMatch],
    [
      "last seek hover delta",
      formatInspectionDelta(lastSeekHoverDeltaFrame, waveform.sampleRate),
    ],
    ["hover source", hoverFrame === null ? "none" : hoverSource],
    ["hover frame", hoverFrame === null ? "none" : String(hoverFrame)],
    [
      "hover time",
      hoverFrame === null ? "none" : formatSeconds(hoverFrame / waveform.sampleRate),
    ],
    [
      "hover delta",
      formatInspectionDelta(hoverDeltaFrame, waveform.sampleRate),
    ],
    ["hover phase", hoverRegion?.name || "none"],
    ["hover sample", hoverSample === null ? "none" : formatCompactNumber(hoverSample)],
    [
      "hover frequency",
      hoverFrequency === null ? "none" : `${formatCompactNumber(hoverFrequency)} Hz`,
    ],
    [
      "hover amplitude",
      hoverAmplitude === null ? "none" : formatCompactNumber(hoverAmplitude),
    ],
    [
      "hover envelope peak",
      hoverEnvelope ? formatCompactNumber(hoverEnvelope.peak) : "none",
    ],
    [
      "hover envelope rms",
      hoverEnvelope ? formatCompactNumber(hoverEnvelope.rms) : "none",
    ],
    [
      "hover signal",
      hoverSignal
        ? `x ${formatCompactNumber(hoverSignal.x)} / y ${formatCompactNumber(hoverSignal.y)}`
        : "none",
    ],
  ]);
  labelInspectionCursorSurface(
    cursor,
    hoverFrame === null ? "transport inspection" : "hover inspection",
    "ok",
  );
}
