function nodeSliderNumberStepClickAmount(event) {
  if (event.altKey) {
    return 100;
  }
  if (event.shiftKey) {
    return 1 + Math.floor(Math.random() * 100);
  }
  if (event.ctrlKey || event.metaKey) {
    return 1 + Math.floor(Math.random() * 10);
  }
  return 1;
}

function stepNodeSliderNumberOnlyValue(readout, direction, event) {
  const slider = document.getElementById(readout.dataset.sliderTarget);
  if (!slider) {
    return;
  }
  const current = Math.round(Number.isFinite(Number(slider.dataset.unboundedValue))
    ? Number(slider.dataset.unboundedValue)
    : Number(slider.value));
  const next = current + nodeSliderNumberStepClickAmount(event) * direction;
  updateNodeSliderCurrentValue(slider, String(next));
}

function randomizeNodeSliderNumberOnlyValue(readout) {
  const slider = document.getElementById(readout.dataset.sliderTarget);
  if (!slider) {
    return;
  }
  const min = Number(slider.min);
  const max = Number(slider.max);
  if (!Number.isFinite(min) || !Number.isFinite(max) || max <= min) {
    return;
  }
  const next = min + Math.floor(Math.random() * (max - min + 1));
  updateNodeSliderCurrentValue(slider, String(next));
}

function nodeSliderReadoutStepTooltip(direction) {
  return direction > 0
    ? "Click +1 · Ctrl+Click +1-10 (random) · Shift+Click +1-100 (random) · Alt+Click +100"
    : "Click -1 · Ctrl+Click -1-10 (random) · Shift+Click -1-100 (random) · Alt+Click -100";
}

function stopNodeSliderReadoutControlPropagation(element) {
  element.addEventListener("pointerdown", (event) => event.stopPropagation());
  element.addEventListener("mousedown", (event) => event.stopPropagation());
  element.addEventListener("dblclick", (event) => event.stopPropagation());
}

function createNodeSliderReadoutStepControl(readout, direction) {
  const step = document.createElement("span");
  step.className = direction > 0
    ? "node-slider-readout-step node-slider-readout-step-plus"
    : "node-slider-readout-step node-slider-readout-step-minus";
  step.setAttribute("role", "button");
  step.setAttribute("aria-label", direction > 0 ? "Increase value" : "Decrease value");
  step.title = nodeSliderReadoutStepTooltip(direction);
  stopNodeSliderReadoutControlPropagation(step);
  step.addEventListener("click", (event) => {
    event.stopPropagation();
    stepNodeSliderNumberOnlyValue(readout, direction, event);
  });
  return step;
}

function createNodeSliderReadoutDiceControl(readout) {
  const dice = document.createElement("span");
  dice.className = "node-slider-readout-dice";
  dice.setAttribute("role", "button");
  dice.setAttribute("aria-label", "Randomize value");
  dice.title = "Click: random value within the parameter's limits";
  stopNodeSliderReadoutControlPropagation(dice);
  dice.addEventListener("click", (event) => {
    event.stopPropagation();
    randomizeNodeSliderNumberOnlyValue(readout);
  });
  return dice;
}

function populateNodeSliderReadoutShell(readout) {
  const amountFill = document.createElement("span");
  amountFill.className = "node-slider-amount-fill";
  amountFill.setAttribute("aria-hidden", "true");
  const portalLeft = document.createElement("span");
  portalLeft.className = "node-slider-readout-portal node-slider-readout-portal-left";
  portalLeft.setAttribute("aria-hidden", "true");
  const portalRight = document.createElement("span");
  portalRight.className = "node-slider-readout-portal node-slider-readout-portal-right";
  portalRight.setAttribute("aria-hidden", "true");
  const labelText = document.createElement("span");
  labelText.className = "node-slider-readout-label";
  const valueText = document.createElement("span");
  valueText.className = "node-slider-readout-value";
  const unitText = document.createElement("span");
  unitText.className = "node-slider-readout-unit";
  readout.append(amountFill, portalLeft, portalRight, labelText, valueText, unitText);
  if (readout.classList.contains("number-only")) {
    readout.append(
      createNodeSliderReadoutStepControl(readout, -1),
      createNodeSliderReadoutStepControl(readout, 1),
      createNodeSliderReadoutDiceControl(readout),
    );
  }
}

function commitNodeSliderReadoutEdit(input) {
  if (input.dataset.editCanceled === "true" || input.dataset.editCommitted === "true") {
    return;
  }
  input.dataset.editCommitted = "true";
  const slider = document.getElementById(input.dataset.sliderTarget);
  updateNodeSliderCurrentValue(slider, input.value);
  const readout = document.createElement("button");
  readout.type = "button";
  readout.className = "node-slider-readout";
  readout.dataset.sliderTarget = input.dataset.sliderTarget;
  readout.dataset.paramLabel = input.dataset.paramLabel || "";
  readout.dataset.control = slider?.dataset?.control || "";
  readout.classList.toggle("number-only", slider?.dataset?.control === "number");
  readout.setAttribute("aria-label", input.getAttribute("aria-label"));
  populateNodeSliderReadoutShell(readout);
  input.replaceWith(readout);
  attachNodeSliderReadoutEvents(readout);
  syncNodeSliderReadout(slider);
}

function cancelNodeSliderReadoutEdit(input) {
  if (input.dataset.editCommitted === "true" || input.dataset.editCanceled === "true") {
    return;
  }
  input.dataset.editCanceled = "true";
  const slider = document.getElementById(input.dataset.sliderTarget);
  const readout = document.createElement("button");
  readout.type = "button";
  readout.className = "node-slider-readout";
  readout.dataset.sliderTarget = input.dataset.sliderTarget;
  readout.dataset.paramLabel = input.dataset.paramLabel || "";
  readout.dataset.control = slider?.dataset?.control || "";
  readout.classList.toggle("number-only", slider?.dataset?.control === "number");
  readout.setAttribute("aria-label", input.getAttribute("aria-label"));
  populateNodeSliderReadoutShell(readout);
  input.replaceWith(readout);
  attachNodeSliderReadoutEvents(readout);
  syncNodeSliderReadout(slider);
}

function beginNodeSliderReadoutEdit(readout) {
  const slider = document.getElementById(readout.dataset.sliderTarget);
  if (!slider) {
    return;
  }

  const input = document.createElement("input");
  input.type = "text";
  input.className = "node-slider-readout-input";
  input.inputMode = "text";
  const editValue = Number.isFinite(Number(slider.dataset.unboundedValue))
    ? Number(slider.dataset.unboundedValue)
    : Number(slider.value);
  input.value = nodeSliderChoiceLabel(slider) ?? formatNodeSliderNumber(editValue, {
    kind: slider.dataset.kind,
    maxDigits: slider.dataset.maxDigits,
    reserveSignSpace: true,
    showSign: nodeSliderShouldShowSign(slider),
  });
  input.dataset.sliderTarget = slider.id;
  input.dataset.paramLabel = readout.dataset.paramLabel || "";
  input.setAttribute("aria-label", readout.getAttribute("aria-label"));
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      commitNodeSliderReadoutEdit(input);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      cancelNodeSliderReadoutEdit(input);
    }
  });
  input.addEventListener("blur", () => {
    if (input.dataset.editCanceled !== "true") {
      commitNodeSliderReadoutEdit(input);
    }
  });
  readout.replaceWith(input);
  input.focus();
  input.select();
}

function updateNodeSliderValueHover(readout, event) {
  const slider = document.getElementById(readout.dataset.sliderTarget);
  if (!slider || slider.dataset.control === "number") {
    readout.classList.remove("value-hovering");
    return;
  }

  const rect = readout.getBoundingClientRect();
  const scale = nodeSliderElementVisualScale(readout);
  const width = Math.max(1, nodeSliderElementLayoutWidth(readout));
  const x = (event.clientX - rect.left) / scale;
  const choices = parseNodeMetadataChoices(slider.dataset.choices || "");
  const usesChoiceSegment = (
    nodeSliderShouldDisplayChoices(slider) &&
    nodeSliderShouldDivideChoicesVisibly(slider) &&
    choices.length > 0
  );

  let start = 0;
  let end = 0;
  if (usesChoiceSegment) {
    const choiceIndex = Math.max(0, Math.min(choices.length - 1, Math.round(Number(slider.value))));
    start = (choiceIndex / choices.length) * width;
    end = ((choiceIndex + 1) / choices.length) * width;
  } else {
    const range = nodeSliderHandleRangeFromTravel(
      slider,
      readout,
      nodeSliderTravelFromValue(slider, Number(slider.value)),
    );
    start = range.start;
    end = range.end;
  }

  readout.classList.toggle("value-hovering", x >= start && x <= end);
}

function nodeSliderReadoutIsNumberOnly(readout) {
  const slider = document.getElementById(readout?.dataset?.sliderTarget);
  return slider?.dataset?.control === "number";
}

function stopNodeSliderReadoutPointer(event) {
  event.preventDefault();
  event.stopPropagation();
}

function attachNodeSliderReadoutEvents(readout) {
  readout.addEventListener("dblclick", () => beginNodeSliderReadoutEdit(readout));
  readout.addEventListener("contextmenu", (event) => openNodeMetadataPopover(event, readout));
  readout.addEventListener("pointermove", (event) => updateNodeSliderValueHover(readout, event));
  readout.addEventListener("pointerleave", () => readout.classList.remove("value-hovering"));
  if (nodeSliderReadoutIsNumberOnly(readout)) {
    readout.addEventListener("pointerdown", stopNodeSliderReadoutPointer);
    readout.addEventListener("mousedown", stopNodeSliderReadoutPointer);
    return;
  }
  readout.addEventListener("pointerdown", beginNodeSliderDrag);
  readout.addEventListener("lostpointercapture", endNodeSliderDrag);
  readout.addEventListener("mousedown", beginNodeSliderDrag);
  readout.addEventListener("keydown", stepNodeSliderFromKeyboard);
}

function createNodeSliderReadout(slider) {
  const label = slider.closest("label");
  if (!label || label.querySelector(".node-slider-readout, .node-slider-readout-input")) {
    return;
  }

  slider.dataset.mid ||= String((Number(slider.min) + Number(slider.max)) / 2);
  slider.dataset.default ||= slider.value;
  slider.dataset.step ||= slider.step || "any";
  slider.step = "any";
  slider.dataset.kind ||= "decimal";
  slider.dataset.maxDigits ||= String(nodeGraphDefaultMetadataMaxDigits(slider.dataset.kind));
  slider.dataset.unit ??= "";
  slider.dataset.choices ??= "";
  slider.dataset.displayChoices ??= "false";
  slider.dataset.divideChoicesVisibly ??= "false";
  slider.dataset.linearSmoothing ??= "true";
  slider.dataset.showSign ??= "false";
  slider.dataset.wraparound ??= "false";

  const readout = document.createElement("button");
  readout.type = "button";
  readout.className = "node-slider-readout";
  readout.dataset.sliderTarget = slider.id;
  readout.dataset.paramLabel = label.dataset.paramLabel || nodeSliderLabelText(slider);
  readout.dataset.control = slider.dataset.control || "";
  readout.classList.toggle("number-only", slider.dataset.control === "number");
  readout.setAttribute("aria-label", `${slider.id} current value`);
  populateNodeSliderReadoutShell(readout);
  attachNodeSliderReadoutEvents(readout);
  label.append(readout);
  syncNodeSliderReadout(slider);
}
