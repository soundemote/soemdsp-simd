function renderPhaseCoverage(phases, wav) {
  const status = document.getElementById("phaseCoverageStatus");
  const totalFrames = Number(wav?.frames || 0);
  const totalPhaseFrames = phaseFrameTotal(phases);
  const delta = totalPhaseFrames - totalFrames;
  const coverage = totalFrames > 0 ? totalPhaseFrames / totalFrames : 0;
  const ok = phases.length > 0 && totalFrames > 0 && delta === 0;

  setStatus("phaseCoverageStatus", ok ? "Complete" : "Check", ok);
  renderKeyValue(document.getElementById("phaseCoverage"), [
    ["phase count", String(phases.length)],
    ["phase frames", String(totalPhaseFrames)],
    ["wav frames", String(totalFrames)],
    ["coverage", formatPercent(coverage * 100)],
    ["delta", formatSignedNumber(delta), 0],
  ]);
}

function renderUnavailablePhaseCoverage() {
  renderKeyValue(document.getElementById("phaseCoverage"), [
    ["phase count", "unavailable", "present"],
    ["phase frames", "unavailable", "present"],
    ["wav frames", "unavailable", "present"],
    ["delta", "unavailable", "0"],
  ]);
}
