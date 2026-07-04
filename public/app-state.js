const state = {
  response: null,
  waveform: null,
  playheadFrame: 0,
  waveformProbeFrame: null,
  waveformProbeSource: null,
  waveformPointerActive: false,
  scrubberPointerActive: false,
  phaseJumpPreviewIndex: null,
  lastSeekSource: null,
  lastSeekFrame: null,
  lastSeekFollowAudio: null,
  followAudio: true,
  reports: [],
  activeReportIndex: 0,
  signalLagMs: 1,
  signalPlotProbe: null,
  signalPhaseFocusIndex: null,
  signalPhaseFocusName: "all",
  signalPlotMode: "trace",
  signalPlotScale: 1,
  signalPlotWindow: "full",
  signalPlotWindowMs: 80,
  manifestLoading: false,
};

function resetSharedProbeState() {
  state.waveformProbeFrame = null;
  state.waveformProbeSource = null;
  state.signalPlotProbe = null;
}

function resetWaveformTransientState() {
  state.waveformPointerActive = false;
  state.scrubberPointerActive = false;
  resetSharedProbeState();
  state.phaseJumpPreviewIndex = null;
  state.lastSeekSource = null;
  state.lastSeekFrame = null;
  state.lastSeekFollowAudio = null;
}
