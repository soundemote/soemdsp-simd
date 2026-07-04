function setActiveReport(index) {
  state.activeReportIndex = index;
  renderReportControls();
  renderActiveReport();
}

function renderReportControls() {
  const container = document.getElementById("reportControls");
  container.replaceChildren();

  for (const [index, report] of state.reports.entries()) {
    const button = document.createElement("button");
    const active = index === state.activeReportIndex;
    const label = `Show report ${report.label}`;
    button.type = "button";
    button.className = "report-button";
    button.classList.toggle("active", active);
    button.dataset.reportIndex = String(index);
    button.dataset.reportKind = report.kind;
    button.dataset.reportPath = report.path || "";
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(active));
    button.title = label;
    button.textContent = report.label;
    button.addEventListener("click", () => setActiveReport(index));
    container.append(button);
  }
}

function renderActiveReport() {
  const viewer = document.getElementById("reportViewer");
  const report = state.reports[state.activeReportIndex];
  if (!report) {
    viewer.textContent = "";
    viewer.dataset.reportLabel = "none";
    viewer.dataset.reportKind = "none";
    viewer.dataset.reportPath = "";
    viewer.dataset.reportState = "unavailable";
    viewer.setAttribute("role", "region");
    viewer.setAttribute("aria-label", "Report viewer unavailable");
    viewer.title = nodeGraphTooltipText("legacyEvidence.reportViewerUnavailable");
    return;
  }

  const stateName = report.ok ? "ok" : "check";
  viewer.dataset.reportLabel = report.label || "";
  viewer.dataset.reportKind = report.kind || "";
  viewer.dataset.reportPath = report.path || "";
  viewer.dataset.reportState = stateName;
  viewer.setAttribute("role", "region");
  viewer.setAttribute("aria-label", `Report viewer ${report.label}: ${stateName}`);
  viewer.title = nodeGraphTooltipText("legacyEvidence.reportViewer", {
    kind: report.kind,
    label: report.label,
    path: report.path || "missing",
    state: stateName,
  });
  viewer.textContent = report.ok
    ? report.text
    : `${report.label}\n${report.error || "Report unavailable"}`;
}

async function renderReports(links) {
  const status = document.getElementById("reportStatus");
  const linksToLoad = reportLinks(links);
  status.textContent = "Loading";
  status.className = "pill";
  state.reports = [];
  state.activeReportIndex = 0;
  renderReportControls();
  renderActiveReport();

  if (linksToLoad.length === 0) {
    status.textContent = "Check";
    status.className = "pill warn";
    return;
  }

  state.reports = await Promise.all(
    linksToLoad.map(async (link) => {
      try {
        const response = await fetch(artifactUrl(link.path), {
          cache: "no-store",
        });
        if (!response.ok) {
          throw new Error(`Report fetch failed: ${response.status}`);
        }

        const text = await response.text();
        return {
          kind: link.kind,
          label: link.label || link.kind,
          ok: true,
          path: link.path,
          text: link.kind === "manifest" ? formatJsonDocument(text) : text,
        };
      } catch (error) {
        return {
          kind: link.kind,
          label: link.label || link.kind,
          ok: false,
          path: link.path,
          error: error instanceof Error ? error.message : String(error),
          text: "",
        };
      }
    }),
  );

  const ok = state.reports.every((report) => report.ok);
  status.textContent = ok
    ? `${state.reports.length} Loaded`
    : `${state.reports.filter((report) => report.ok).length}/${
        state.reports.length
      } Loaded`;
  status.className = ok ? "pill good" : "pill warn";
  renderReportControls();
  renderActiveReport();
  renderHandsOnReadiness(state.response?.manifest, Boolean(state.waveform));
}
