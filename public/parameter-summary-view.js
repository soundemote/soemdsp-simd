function renderParameterSummaryCards(pairs) {
  const container = document.getElementById("parameterSummary");
  container.replaceChildren();

  const firstFrequency = parseSummaryNumber(pairs.get("first half frequency"));
  const firstAmplitude = parseSummaryNumber(pairs.get("first half amplitude"));
  const firstBias = parseSummaryNumber(pairs.get("first half bias"));
  const secondFrequency = parseSummaryNumber(pairs.get("second half frequency"));
  const secondAmplitude = parseSummaryNumber(pairs.get("second half amplitude"));
  const secondBias = parseSummaryNumber(pairs.get("second half bias"));
  const hasBias = pairs.has("first half bias") || pairs.has("second half bias");
  const values = [
    [
      "First Frequency",
      pairs.get("first half frequency"),
      "",
      isPositiveNumber(firstFrequency),
    ],
    [
      "First Amplitude",
      pairs.get("first half amplitude"),
      "",
      isPositiveNumber(firstAmplitude),
    ],
    [
      "Second Frequency",
      pairs.get("second half frequency"),
      "",
      isPositiveNumber(secondFrequency),
    ],
    [
      "Second Amplitude",
      pairs.get("second half amplitude"),
      "",
      isPositiveNumber(secondAmplitude),
    ],
    ...(hasBias
      ? [
          [
            "First Bias",
            pairs.get("first half bias"),
            "",
            Number.isFinite(firstBias),
          ],
          [
            "Second Bias",
            pairs.get("second half bias"),
            "",
            Number.isFinite(secondBias),
          ],
        ]
      : []),
    [
      "Frequency Change",
      formatSummaryChange(firstFrequency, secondFrequency),
      "comparison",
      isUpwardChange(firstFrequency, secondFrequency),
    ],
    [
      "Amplitude Change",
      formatSummaryChange(firstAmplitude, secondAmplitude),
      "comparison",
      isUpwardChange(firstAmplitude, secondAmplitude),
    ],
    ...(hasBias
      ? [
          [
            "Bias Change",
            formatSummaryChange(firstBias, secondBias),
            "comparison",
            Number.isFinite(firstBias) && Number.isFinite(secondBias) && firstBias !== secondBias,
          ],
        ]
      : []),
  ];

  for (const [label, value, kind, ok] of values) {
    const valueText = value || "missing";
    const stateName = ok === true ? "ok" : "check";
    const item = document.createElement("div");
    item.className = "summary-card";
    if (kind === "comparison") {
      item.classList.add("comparison");
    }
    item.dataset.summaryLabel = label;
    item.dataset.summaryValue = valueText;
    item.dataset.summaryKind = kind || "value";
    item.dataset.summaryState = stateName;
    item.setAttribute("role", "group");
    item.setAttribute("aria-label", `${label}: ${valueText}`);
    item.title = nodeGraphTooltipText("legacyEvidence.labeledState", {
      label,
      state: stateName,
      value: valueText,
    });

    const title = document.createElement("span");
    title.textContent = label.toUpperCase();

    const body = document.createElement("strong");
    body.textContent = valueText;
    if (!value || ok !== true) {
      body.className = "warn";
    }

    item.append(title, body);
    container.append(item);
  }
}

function renderUnavailableParameterSummary() {
  renderParameterSummaryCards(
    new Map([
      ["first half frequency", "unavailable"],
      ["first half amplitude", "unavailable"],
      ["second half frequency", "unavailable"],
      ["second half amplitude", "unavailable"],
    ]),
  );
}

function parameterResyncPairs(manifest) {
  const resync = manifest?.parameterResync || {};
  const frequency = resync.frequency || {};
  const amplitude = resync.amplitude || {};
  const pairs = new Map([
    ["first half frequency", manifestValueText(frequency.first)],
    ["first half amplitude", manifestValueText(amplitude.first)],
    ["second half frequency", manifestValueText(frequency.second)],
    ["second half amplitude", manifestValueText(amplitude.second)],
  ]);
  if (resync.bias && typeof resync.bias === "object") {
    pairs.set("first half bias", manifestValueText(resync.bias.first));
    pairs.set("second half bias", manifestValueText(resync.bias.second));
  }

  return [...pairs.values()].every(Boolean) ? pairs : null;
}

async function renderParameterSummary(manifest, links) {
  const status = document.getElementById("parameterSummaryStatus");
  const manifestPairs = parameterResyncPairs(manifest);
  if (manifestPairs) {
    renderParameterSummaryCards(manifestPairs);
    status.textContent = "Manifest";
    status.className = "pill good";
    return;
  }

  const path = findArtifactPath(links, "text-summary");
  status.textContent = "Loading";
  status.className = "pill";

  if (!path) {
    status.textContent = "Check";
    status.className = "pill warn";
    renderParameterSummaryCards(new Map());
    return;
  }

  try {
    const response = await fetch(artifactUrl(path), { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Summary fetch failed: ${response.status}`);
    }

    const pairs = parseSummaryText(await response.text());
    renderParameterSummaryCards(pairs);
    status.textContent = "Loaded";
    status.className = "pill good";
  } catch (error) {
    status.textContent = "Check";
    status.className = "pill warn";
    renderParameterSummaryCards(new Map());
    console.error(error);
  }
}
