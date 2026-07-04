function labelSignalPlotButton(button, label, active = false) {
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-pressed", String(active));
  button.title = label;
  button.classList.toggle("active", active);
}

function renderSignalPlotControls() {
  const container = document.getElementById("signalPlotControls");
  container.replaceChildren();
  restoreSignalPlotFocusIndex();

  const focusGroup = document.createElement("div");
  focusGroup.className = "control-group";
  focusGroup.setAttribute("aria-label", "Signal plot focus");
  const modeGroup = document.createElement("div");
  modeGroup.className = "control-group";
  modeGroup.setAttribute("aria-label", "Signal plot mode");
  const scaleGroup = document.createElement("div");
  scaleGroup.className = "control-group";
  scaleGroup.setAttribute("aria-label", "Signal plot scale");
  const windowGroup = document.createElement("div");
  windowGroup.className = "control-group";
  windowGroup.setAttribute("aria-label", "Signal plot window");
  const windowSizeGroup = document.createElement("div");
  windowSizeGroup.className = "control-group";
  windowSizeGroup.setAttribute("aria-label", "Signal plot window size");
  const lagGroup = document.createElement("div");
  lagGroup.className = "control-group";
  lagGroup.setAttribute("aria-label", "Signal plot lag");
  const resetGroup = document.createElement("div");
  resetGroup.className = "control-group";
  resetGroup.setAttribute("aria-label", "Signal plot reset");

  const allButton = document.createElement("button");
  allButton.type = "button";
  allButton.className = "phase-button";
  allButton.dataset.signalFocus = "all";
  allButton.textContent = "all";
  labelSignalPlotButton(
    allButton,
    "Signal plot focus all",
    state.signalPhaseFocusIndex === null,
  );
  allButton.addEventListener("click", () => {
    state.signalPhaseFocusIndex = null;
    state.signalPhaseFocusName = "all";
    saveSignalPlotSettings();
    renderSignalPlot();
  });
  focusGroup.append(allButton);

  for (const [index, region] of (state.waveform?.regions || []).entries()) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "phase-button";
    button.dataset.signalFocus = region.name;
    button.textContent = region.name;
    labelSignalPlotButton(
      button,
      `Signal plot focus ${region.name}`,
      index === state.signalPhaseFocusIndex,
    );
    button.addEventListener("click", () => {
      state.signalPhaseFocusIndex = index;
      state.signalPhaseFocusName = region.name;
      saveSignalPlotSettings();
      renderSignalPlot();
    });
    focusGroup.append(button);
  }

  for (const mode of ["trace", "points"]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "phase-button";
    button.dataset.signalMode = mode;
    button.textContent = mode;
    labelSignalPlotButton(button, `Signal plot mode ${mode}`, mode === state.signalPlotMode);
    button.addEventListener("click", () => {
      state.signalPlotMode = mode;
      saveSignalPlotSettings();
      renderSignalPlot();
    });
    modeGroup.append(button);
  }

  for (const scale of [1, 2, 4]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "phase-button";
    button.dataset.signalScale = String(scale);
    button.textContent = `x${scale}`;
    labelSignalPlotButton(
      button,
      `Signal plot scale x${scale}`,
      scale === state.signalPlotScale,
    );
    button.addEventListener("click", () => {
      state.signalPlotScale = scale;
      saveSignalPlotSettings();
      renderSignalPlot();
    });
    scaleGroup.append(button);
  }

  for (const windowMode of ["full", "cursor"]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "phase-button";
    button.dataset.signalWindow = windowMode;
    button.textContent = windowMode;
    labelSignalPlotButton(
      button,
      `Signal plot window ${windowMode}`,
      windowMode === state.signalPlotWindow,
    );
    button.addEventListener("click", () => {
      state.signalPlotWindow = windowMode;
      saveSignalPlotSettings();
      renderSignalPlot();
    });
    windowGroup.append(button);
  }

  for (const windowMs of [40, 80, 160]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "phase-button";
    button.dataset.signalWindowMs = String(windowMs);
    button.textContent = `${windowMs} ms`;
    labelSignalPlotButton(
      button,
      `Signal plot window size ${windowMs} ms`,
      windowMs === state.signalPlotWindowMs,
    );
    button.addEventListener("click", () => {
      state.signalPlotWindowMs = windowMs;
      saveSignalPlotSettings();
      renderSignalPlot();
    });
    windowSizeGroup.append(button);
  }

  for (const lagMs of [1, 2, 5, 10]) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "phase-button";
    button.dataset.signalLagMs = String(lagMs);
    button.textContent = `${lagMs} ms`;
    labelSignalPlotButton(button, `Signal plot lag ${lagMs} ms`, lagMs === state.signalLagMs);
    button.addEventListener("click", () => {
      state.signalLagMs = lagMs;
      saveSignalPlotSettings();
      renderSignalPlot();
    });
    lagGroup.append(button);
  }

  const resetButton = document.createElement("button");
  resetButton.type = "button";
  resetButton.className = "phase-button";
  resetButton.dataset.signalReset = "settings";
  resetButton.textContent = "reset";
  labelSignalPlotButton(resetButton, "Signal plot reset settings");
  resetButton.addEventListener("click", () => {
    resetSignalPlotSettings();
    renderSignalPlot();
  });
  resetGroup.append(resetButton);

  container.append(
    focusGroup,
    modeGroup,
    scaleGroup,
    windowGroup,
    windowSizeGroup,
    lagGroup,
    resetGroup,
  );
}
