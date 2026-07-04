function artifactRowsLabeled(manifest) {
  const links = Array.isArray(manifest?.artifactLinks) ? manifest.artifactLinks : [];
  const rows = [...document.querySelectorAll("#artifactList .artifact-row")];
  return (
    links.length > 0 &&
    rows.length === links.length &&
    rows.every((row, index) => {
      const link = links[index];
      const label = row.getAttribute("aria-label") || "";
      return (
        row.dataset.artifactKind === (link.kind || "") &&
        row.dataset.artifactPath === (link.path || "") &&
        row.dataset.artifactLabel === (link.label || "") &&
        label === artifactRowLabel(link) &&
        row.title === label &&
        (link.path
          ? row.tagName === "A" &&
            row.getAttribute("href") === artifactUrl(link.path) &&
            row.getAttribute("target") === "_blank" &&
            row.getAttribute("rel") === "noreferrer"
          : row.tagName === "DIV" && row.getAttribute("role") === "group")
      );
    })
  );
}

function sandboxContractRowsLabeled() {
  const rows = [...document.querySelectorAll("#sandboxContract .contract-row")];
  return (
    rows.length === 9 &&
    rows.every(
      (row) =>
        row.dataset.contractKind !== undefined &&
        row.dataset.contractLabel !== undefined &&
        row.dataset.contractState === "ok" &&
        row.getAttribute("role") === "group" &&
        row.getAttribute("aria-label") ===
          `${row.dataset.contractKind}: ${row.dataset.contractLabel} / ok` &&
        row.title === row.getAttribute("aria-label"),
    )
  );
}

function keyValueRowsLabeled(containerId, expectedRows) {
  const container = document.getElementById(containerId);
  const terms = [...(container?.querySelectorAll("dt") || [])];
  const values = [...(container?.querySelectorAll("dd") || [])];
  return (
    terms.length === expectedRows &&
    values.length === expectedRows &&
    values.every((value, index) => {
      const term = terms[index];
      return (
        term?.dataset.kvKey === value.dataset.kvKey &&
        value.dataset.kvKey !== undefined &&
        value.dataset.kvValue !== undefined &&
        value.dataset.kvExpected !== undefined &&
        value.dataset.kvState !== undefined &&
        value.getAttribute("aria-label") === `${value.dataset.kvKey}: ${value.dataset.kvValue}` &&
        Boolean(value.title)
      );
    })
  );
}

function producerProofRowsLabeled() {
  return (
    keyValueRowsLabeled("producerProof", 9) ||
    keyValueRowsLabeled("producerProof", 10)
  );
}

function boundaryFlagRowsLabeled() {
  return keyValueRowsLabeled("boundaryFlags", requiredFlags.length);
}

function phaseCoverageRowsLabeled() {
  return keyValueRowsLabeled("phaseCoverage", 5);
}

function artifactCoverageRowsLabeled() {
  return keyValueRowsLabeled("artifactCoverage", 12);
}

function sourceRowsLabeled() {
  const ids = [
    "manifestPath",
    "sourceError",
    "sourceDetail",
    "manifestHttpStatus",
    "manifestBytes",
    "manifestModified",
    "manifestLoadedAt",
    "manifestCacheControl",
    "manifestPragma",
    "manifestExpires",
    "artifactRoot",
  ];
  return ids.every((id) => {
    const value = document.getElementById(id);
    return (
      value &&
      value.dataset.sourceKey !== undefined &&
      value.dataset.sourceValue !== undefined &&
      value.dataset.sourceExpected !== undefined &&
      value.dataset.sourceState === "ok" &&
      value.getAttribute("aria-label") === `${value.dataset.sourceKey}: ${value.dataset.sourceValue}` &&
      Boolean(value.title)
    );
  });
}

function parameterSummaryCardsLabeled() {
  const cards = [...document.querySelectorAll("#parameterSummary .summary-card")];
  return (
    (cards.length === 6 || cards.length === 9) &&
    cards.every((card) => {
      const label = card.getAttribute("aria-label") || "";
      return (
        card.dataset.summaryLabel !== undefined &&
        card.dataset.summaryValue !== undefined &&
        card.dataset.summaryKind !== undefined &&
        card.dataset.summaryState === "ok" &&
        card.getAttribute("role") === "group" &&
        label === `${card.dataset.summaryLabel}: ${card.dataset.summaryValue}` &&
        card.title === `${label} / ok`
      );
    })
  );
}

function checkRowsLabeled(containerId, expectedRows) {
  const rows = [...document.querySelectorAll(`#${containerId} .check-row`)];
  return (
    rows.length === expectedRows &&
    rows.every((row) => {
      const label = row.getAttribute("aria-label") || "";
      return (
        row.dataset.checkLabel !== undefined &&
        row.dataset.checkState === "ok" &&
        row.getAttribute("role") === "group" &&
        label === `${row.dataset.checkLabel}: ok` &&
        row.title === label
      );
    })
  );
}

function checkRowsHaveUniqueLabels(rows) {
  const labels = rows.map(([label]) => label);
  return (
    labels.length > 0 &&
    labels.every((label) => typeof label === "string" && label.trim().length > 0) &&
    new Set(labels).size === labels.length
  );
}

function consumerChecklistRowsLabeled() {
  return checkRowsLabeled("checklist", 22);
}
