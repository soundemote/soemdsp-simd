async function bindNodeGraphMvpEventGroup(label, binder) {
  try {
    await binder();
    return true;
  } catch (error) {
    console.error(`Node graph event binding failed: ${label}`, error);
    document.documentElement.dataset.nodeGraphEventBindingError = label;
    document.documentElement.dataset.nodeGraphEventBindingErrorMessage = error?.message || String(error);
    return false;
  }
}

async function bindNodeGraphMvpEvents() {
  await bindNodeGraphMvpEventGroup("help", bindNodeGraphHelpAndPaletteEvents);
  await bindNodeGraphMvpEventGroup("workspace", bindNodeGraphWorkspaceInteractionEvents);
  await bindNodeGraphMvpEventGroup("keyboard", () => {
    bindNodeGraphFloatingWindowLockHandles();
    document.addEventListener("keydown", handleNodeGraphFloatingWindowKeyboardNudge, true);
    document.addEventListener("keyup", handleNodeGraphFloatingWindowKeyboardRelease, true);
    document.addEventListener("keydown", handleNodeGraphKeydown);
    // When embedded in an iframe (e.g. the soundemote-site sandbox page),
    // clicking a module selects it via mouse events (hit-testing, no focus
    // needed) but keyboard shortcuts -- Delete included -- only ever reach
    // whichever document currently holds focus. A click alone doesn't
    // guarantee that's us, so explicitly claim window focus on interaction.
    document.addEventListener(
      "pointerdown",
      (event) => {
        if (!nodeGraphEventTargetIsEditable(event.target)) {
          window.focus();
        }
      },
      true,
    );
  });
  await bindNodeGraphMvpEventGroup("scene-menu", bindNodeGraphSceneMenuEvents);
  await bindNodeGraphMvpEventGroup("header", bindNodeGraphHeaderControlEvents);
  await bindNodeGraphMvpEventGroup("render-live", bindNodeGraphRenderLiveControlEvents);
  await bindNodeGraphMvpEventGroup("ui-view", bindNodeGraphUiViewEvents);
  await bindNodeGraphMvpEventGroup("ui-dev", bindNodeGraphUiDevSettingsEvents);
  await bindNodeGraphMvpEventGroup("settings", bindNodeGraphSettingsFormEvents);
  await bindNodeGraphMvpEventGroup("sliders", bindNodeGraphSliderDragEvents);
}
