function nodeGraphSliderForParameter(node, key) {
  return nodeGraphNodeElement(node)?.querySelector(
    `input[data-param="${CSS.escape(key)}"]`,
  );
}

function nodeGraphNormalizedParameterSignalBounds(signal, metadata = {}) {
  return metadata.wraparound
    ? wrapNodeSliderValue(Number(signal) || 0, 0, 1)
    : clampNodeSliderValue(Number(signal) || 0, 0, 1);
}

function nodeGraphParameterGhostSignal(node, key) {
  const patchNode = nodeGraphPatchNode(node);
  if (!patchNode) {
    return null;
  }
  const metadata = nodeGraphReadPatchParameterMetadata(patchNode, key);
  const targetSlider = nodeGraphSliderForParameter(node, key);
  const baseSignal = nodeGraphParameterValueToNormalizedSignal(
    targetSlider ? nodeGraphReadNodeNumber(node, key) : nodeGraphReadPatchParameterValue(patchNode, key),
    metadata,
  );
  let contribution = 0;
  let parameterSourceCount = 0;
  for (const modulation of nodeGraphMvp.patch.modulations || []) {
    if (modulation.destinationNode !== node || modulation.destinationParam !== key) {
      continue;
    }
    const sourceType = nodeGraphPatchNodeType(modulation.sourceNode);
    const sourceParameter = nodeGraphParameterOutputPort(sourceType, modulation.sourcePort);
    if (!sourceParameter) {
      continue;
    }
    const sourceSlider = nodeGraphSliderForParameter(modulation.sourceNode, modulation.sourcePort);
    contribution += nodeGraphParameterValueToNormalizedSignal(
      sourceSlider
        ? nodeGraphReadNodeNumber(modulation.sourceNode, modulation.sourcePort)
        : nodeGraphReadPatchParameterValue(modulation.sourceNode, modulation.sourcePort),
      nodeGraphReadPatchParameterMetadata(modulation.sourceNode, modulation.sourcePort),
    );
    parameterSourceCount += 1;
  }
  if (!parameterSourceCount) {
    return null;
  }
  return nodeGraphNormalizedParameterSignalBounds(baseSignal + contribution, metadata);
}

function syncNodeGraphGhostSliders() {
  for (const slider of document.querySelectorAll(".dsp-node input[data-param]")) {
    const node = slider.closest(".dsp-node")?.dataset.node;
    const key = slider.dataset.param;
    const readout = slider.closest("label")?.querySelector(".node-slider-readout");
    if (!node || !key || !readout) {
      continue;
    }
    const ghostSignal = nodeGraphParameterGhostSignal(node, key);
    readout.classList.toggle("has-ghost-slider", ghostSignal !== null);
    if (ghostSignal === null) {
      readout.style.removeProperty("--ghost-start");
      readout.style.removeProperty("--ghost-end");
      continue;
    }
    const range = nodeSliderHandleRangeFromTravel(
      slider,
      readout,
      clampNodeSliderValue(ghostSignal, 0, 1),
    );
    readout.style.setProperty(
      "--ghost-start",
      `${range.start}px`,
    );
    readout.style.setProperty(
      "--ghost-end",
      `${range.end}px`,
    );
  }
}
