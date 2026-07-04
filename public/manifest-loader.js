function renderRefreshButton(loading = state.manifestLoading) {
  const button = document.getElementById("refreshButton");
  if (!button) {
    return;
  }
  const label = loading ? "Loading manifest" : "Reload manifest";
  button.disabled = loading;
  button.textContent = loading ? "Loading Manifest" : "Reload Manifest";
  button.setAttribute("aria-label", label);
  button.setAttribute("aria-busy", String(loading));
  button.dataset.loading = String(loading);
  button.title = nodeGraphTooltipText(
    loading ? "legacyEvidence.manifestReloading" : "legacyEvidence.manifestReload",
  );
}

async function loadManifest() {
  if (state.manifestLoading) {
    return;
  }

  state.manifestLoading = true;
  renderRefreshButton();
  try {
    const response = await fetch("/api/manifest", { cache: "no-store" });
    const payload = await response.json();
    payload.responseStatus = response.status;
    payload.responseStatusText = response.statusText;
    payload.responseHeaders = {
      cacheControl: response.headers.get("cache-control") || "",
      expires: response.headers.get("expires") || "",
      pragma: response.headers.get("pragma") || "",
    };
    if (!response.ok || !payload.ok) {
      renderError(payload.error || "Manifest failed", payload);
      return;
    }
    const shapeError = manifestShapeError(payload);
    if (shapeError) {
      renderError(shapeError, payload);
      return;
    }
    render(payload);
  } catch (error) {
    renderError(error instanceof Error ? error.message : String(error));
  } finally {
    state.manifestLoading = false;
    renderRefreshButton();
  }
}
