function render(response) {
  state.response = response;
  const manifest = response.manifest;
  const handoff = manifest.sandboxHandoff;
  const checklist = validateConsumerChecklist(manifest);

  setStatus("manifestStatus", statusText(manifest.allOk), manifest.allOk);
  setStatus(
    "contractStatus",
    `${handoff.contract} v${handoff.contractVersion}`,
    handoff.contract === expectedContract &&
      handoff.contractVersion === expectedContractVersion,
  );
  setStatus(
    "inspectionMode",
    handoff.inspectionMode,
    handoff.inspectionMode === expectedInspectionMode,
  );
  setText("frameCount", String(manifest.wav.frames));
  setStatus(
    "checklistStatus",
    checklist.accepted ? "Accepted" : "Check",
    checklist.accepted,
  );
  labelPrimaryAudioTitle(handoff.primaryAudioArtifact, true);
  renderSource(response);
  renderHandsOnReadiness(manifest, false);

  const audio = document.getElementById("audioPlayer");
  audio.src = artifactUrl(handoff.primaryAudioArtifact);
  labelPrimaryAudio(handoff.primaryAudioArtifact, true);
  renderAudioPosition();
  renderWaveform(handoff.primaryAudioArtifact);

  renderKeyValue(
    document.getElementById("boundaryFlags"),
    requiredFlags.map(([key, expected]) => [
      key,
      boolText(handoff[key]),
      expected,
    ]),
  );
  renderProducerProof(manifest);
  renderCircuitChain(manifest);
  renderSandboxContract(manifest);
  renderParameterTimeline(manifest);
  renderPhaseCoverage(manifest.phases || [], manifest.wav);
  renderPhases(manifest.phases || [], manifest.wav);
  renderChecklist(checklist);
  renderArtifactCoverage(manifest);
  renderParameterSummary(manifest, manifest.artifactLinks || []);
  renderReports(manifest.artifactLinks || []);
  renderArtifacts(manifest.artifactLinks || []);
}

function renderError(message, details = {}) {
  state.response = null;
  state.waveform = null;
  state.playheadFrame = 0;
  resetWaveformTransientState();
  state.reports = [];
  state.activeReportIndex = 0;

  setStatus("manifestStatus", "Check", false);
  setStatus("contractStatus", message, false);
  setStatus("inspectionMode", "Unavailable", false);
  setText("frameCount", "0");
  setStatus("checklistStatus", "Check", false);
  setStatus("producerStatus", "Check", false);
  setStatus("circuitChainStatus", "Check", false);
  setStatus("handsOnReadinessStatus", "Check", false);
  setInspectionCursorSource("none", "none");
  setInspectionCursorDelta(null, 1);
  setInspectionCursorAudio(0, Number.NaN);
  setInspectionCursorPlayback(null);
  setInspectionCursorPreview(false);
  setInspectionCursorSeek(null);
  setInspectionCursorSeekTarget(null, null, 1);
  setInspectionCursorSeekSync("none");
  setInspectionCursorTransport(null, null, 1);
  setInspectionCursorTarget(null, null, 1);
  setInspectionCursorDivergence(null, null);
  setStatus("sandboxContractStatus", "Check", false);
  setStatus("parameterSummaryStatus", "Check", false);
  setStatus("parameterTimelineStatus", "Check", false);
  setText("parameterTimelinePhase", "phase");
  resetIdleProbePill("parameterTimelineProbe", "Parameter timeline probe idle");
  setStatus("waveformStatus", "Check", false);
  resetIdleProbePill("waveformProbe", "Waveform probe idle");
  setStatus("levelEnvelopeStatus", "Check", false);
  setText("levelEnvelopePeak", "peak 0");
  setText("levelEnvelopeRms", "rms 0");
  resetIdleProbePill("levelEnvelopeProbe", "Level envelope probe idle");
  setStatus("currentParameterStatus", "Check", false);
  setText("currentFrequency", "freq");
  setText("currentAmplitude", "amp");
  setText("currentMeasuredFrequency", "measured freq");
  setText("currentMeasuredPeak", "peak");
  setText("currentMeasuredFrequencyDelta", "freq delta");
  setText("currentMeasuredPeakDelta", "peak delta");
  setStatus("currentMeasuredStatus", "measured", false);
  setText("waveformPhaseJumpTarget", "jump idle");
  setStatus("signalPlotStatus", "Check", false);
  setText("signalPlotModeSummary", "all / trace / x1");
  setText("signalPlotWindowSummary", "window full");
  setText("signalPlotLagSummary", "lag 1 ms");
  setText("signalPlotPoint", "frame 0 / phase none / x 0 / y 0");
  resetIdleProbePill("signalPlotProbe", "Signal plot probe idle");
  resetProbePill("signalPlotProbeSource", "near frame", "Signal plot source probe idle");
  setStatus("phaseCoverageStatus", "Check", false);
  setStatus("phaseAudioStatsStatus", "Check", false);
  resetIdleProbePill("phaseAudioStatsProbe", "Phase audio stats probe idle");
  resetIdleProbePill("phaseProbe", "Phase list probe idle");
  setStatus("phaseStatus", "Check", false);
  setStatus("artifactCoverageStatus", "Check", false);
  setStatus("reportStatus", "Check", false);
  setStatus("artifactStatus", "Check", false);
  setStatus("sourceStatus", "Check", false);
  labelPrimaryAudioTitle("", false);
  setSourceText(
    "manifestPath",
    "Manifest",
    details.path || details.manifestPath || "Unavailable",
    "present",
    false,
  );
  setSourceText(
    "sourceError",
    "Source Error",
    message || details.message || "Unavailable",
    "none",
    false,
  );
  setSourceText("sourceDetail", "Source Detail", details.message || "none", "none", false);
  setSourceText(
    "manifestHttpStatus",
    "HTTP Status",
    formatHttpStatus(details.responseStatus, details.responseStatusText),
    "200 OK",
    false,
  );
  setSourceText("manifestBytes", "Manifest Bytes", "Unavailable", "positive", false);
  setSourceText("manifestModified", "Manifest Modified", "Unavailable", "valid timestamp", false);
  setSourceText("manifestLoadedAt", "Response Loaded", "Unavailable", "valid timestamp", false);
  setSourceText("manifestCacheControl", "Cache Control", "Unavailable", "no-store", false);
  setSourceText("manifestPragma", "Pragma", "Unavailable", "no-cache", false);
  setSourceText("manifestExpires", "Expires", "Unavailable", "0", false);
  setSourceText("artifactRoot", "Artifact Root", details.artifactRoot || "Unavailable", "present", false);

  const audio = document.getElementById("audioPlayer");
  audio.removeAttribute("src");
  labelPrimaryAudio("", false);
  audio.load();
  renderAudioPosition();

  renderUnavailableProducerProof();
  renderUnavailableCircuitChain();
  renderUnavailableHandsOnReadiness();
  renderUnavailableSandboxContract();
  renderUnavailableParameterSummary();
  renderUnavailableParameterTimeline();
  renderReportControls();
  renderActiveReport();
  renderWaveformPhaseControls();
  renderWaveformPosition();
  renderUnavailableWaveformMeta();
  renderUnavailableLevelEnvelopeMeta();
  renderLevelEnvelopeProbe();
  renderUnavailablePhaseAudioStats();
  renderSignalPlotControls();
  clearSignalPlotProbe();
  renderUnavailableSignalPlotMeta();
  renderUnavailableBoundaryFlags();
  renderUnavailablePhaseCoverage();
  renderUnavailablePhases();
  renderUnavailableChecklist();
  renderUnavailableArtifactCoverage();
  renderUnavailableArtifacts();
}
