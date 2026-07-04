const signalPlotSettingsKey = "soemdsp-sandbox.signalPlotSettings";

function loadSignalPlotSettings() {
  try {
    const settings = JSON.parse(
      window.localStorage.getItem(signalPlotSettingsKey) || "{}",
    );
    if ([1, 2, 5, 10].includes(settings.signalLagMs)) {
      state.signalLagMs = settings.signalLagMs;
    }
    if (typeof settings.signalPhaseFocusName === "string") {
      state.signalPhaseFocusName = settings.signalPhaseFocusName;
    }
    if ([1, 2, 4].includes(settings.signalPlotScale)) {
      state.signalPlotScale = settings.signalPlotScale;
    }
    if (["trace", "points"].includes(settings.signalPlotMode)) {
      state.signalPlotMode = settings.signalPlotMode;
    }
    if (["full", "cursor"].includes(settings.signalPlotWindow)) {
      state.signalPlotWindow = settings.signalPlotWindow;
    }
    if ([40, 80, 160].includes(settings.signalPlotWindowMs)) {
      state.signalPlotWindowMs = settings.signalPlotWindowMs;
    }
  } catch (_error) {
    window.localStorage.removeItem(signalPlotSettingsKey);
  }
}

function saveSignalPlotSettings() {
  window.localStorage.setItem(
    signalPlotSettingsKey,
    JSON.stringify({
      signalLagMs: state.signalLagMs,
      signalPhaseFocusName: state.signalPhaseFocusName,
      signalPlotMode: state.signalPlotMode,
      signalPlotScale: state.signalPlotScale,
      signalPlotWindow: state.signalPlotWindow,
      signalPlotWindowMs: state.signalPlotWindowMs,
    }),
  );
}

function resetSignalPlotSettings() {
  state.signalLagMs = 1;
  state.signalPhaseFocusIndex = null;
  state.signalPhaseFocusName = "all";
  state.signalPlotMode = "trace";
  state.signalPlotScale = 1;
  state.signalPlotWindow = "full";
  state.signalPlotWindowMs = 80;
  window.localStorage.removeItem(signalPlotSettingsKey);
}

Object.assign(window, {
  loadSignalPlotSettings,
  resetSignalPlotSettings,
  saveSignalPlotSettings,
});
