function bindNodeGraphHelpAndPaletteEvents() {
  const nodePanel = document.querySelector(".node-wiring-panel");
  nodePanel?.addEventListener("pointerover", handleNodeInteractionHelp);
  nodePanel?.addEventListener("pointermove", handleNodeInteractionHelp);
  nodePanel?.addEventListener("mouseover", handleNodeInteractionHelp);
  nodePanel?.addEventListener("mousemove", handleNodeInteractionHelp);
  nodePanel?.addEventListener("pointerdown", handleNodeInteractionHelp);
  nodePanel?.addEventListener("click", handleNodeInteractionHelp);
  nodePanel?.addEventListener("focusin", handleNodeInteractionHelp);
  document.getElementById("nodeInteractionHelp")?.setAttribute("data-ready", "true");
  for (const element of document.querySelectorAll(
    ".node-view-toolbar button, .node-graph-controls button, .node-slider-readout",
  )) {
    attachNodeInteractionHelpTarget(element);
  }
  for (const button of document.querySelectorAll("[data-palette-node]")) {
    button.addEventListener("click", () => showPaletteNode(button.dataset.paletteNode));
  }
}
