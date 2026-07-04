function renderKeyValue(container, rows) {
  container.replaceChildren();
  for (const [key, value, expected] of rows) {
    const dt = document.createElement("dt");
    const dd = document.createElement("dd");
    const valueText = String(value);
    dt.textContent = key;
    dd.textContent = valueText;
    const expectedText =
      typeof expected === "boolean" ? boolText(expected) : String(expected);
    const stateName = expected !== undefined && value !== expectedText ? "check" : "ok";
    dt.dataset.kvKey = key;
    dt.title = key;
    dd.dataset.kvKey = key;
    dd.dataset.kvValue = valueText;
    dd.dataset.kvExpected = expected === undefined ? "none" : expectedText;
    dd.dataset.kvState = stateName;
    dd.setAttribute("aria-label", `${key}: ${valueText}`);
    dd.title =
      expected === undefined
        ? `${key}: ${valueText}`
        : `${key}: ${valueText} / expected ${expectedText}`;
    if (expected !== undefined && value !== expectedText) {
      dd.className = "warn";
    }
    container.append(dt, dd);
  }
}
