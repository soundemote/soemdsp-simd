function renderSource(response) {
  const info = response.manifestInfo || {};
  const hasPath = Boolean(response.manifestPath);
  const hasRoot = Boolean(response.artifactRoot);
  const bytes = Number(info.bytes);
  const hasBytes = Number.isFinite(bytes) && bytes > 0;
  const modified = formatTimestamp(info.modifiedUtc);
  const hasModified = modified !== "missing" && modified !== "invalid";
  const headers = response.responseHeaders || {};
  const cacheControl = headers.cacheControl || "missing";
  const pragma = headers.pragma || "missing";
  const expires = headers.expires || "missing";
  const cacheOk =
    cacheControl.includes("no-store") &&
    pragma === "no-cache" &&
    expires === "0";
  const ok = hasPath && hasRoot && hasBytes && hasModified && cacheOk;
  const httpStatus = formatHttpStatus(response.responseStatus, response.responseStatusText);
  const loadedAt = formatTimestamp(new Date().toISOString());

  setStatus("sourceStatus", ok ? "Loaded" : "Check", ok);
  setSourceText("manifestPath", "Manifest", response.manifestPath || "missing", "present", hasPath);
  setSourceText("sourceError", "Source Error", "none", "none", true);
  setSourceText("sourceDetail", "Source Detail", "none", "none", true);
  setSourceText("manifestHttpStatus", "HTTP Status", httpStatus, "200 OK", response.responseStatus === 200);
  setSourceText("artifactRoot", "Artifact Root", response.artifactRoot || "missing", "present", hasRoot);
  setSourceText("manifestBytes", "Manifest Bytes", hasBytes ? formatBytes(bytes) : "missing", "positive", hasBytes);
  setSourceText("manifestModified", "Manifest Modified", modified, "valid timestamp", hasModified);
  setSourceText("manifestLoadedAt", "Response Loaded", loadedAt, "valid timestamp", loadedAt !== "missing" && loadedAt !== "invalid");
  setSourceText("manifestCacheControl", "Cache Control", cacheControl, "no-store", cacheControl.includes("no-store"));
  setSourceText("manifestPragma", "Pragma", pragma, "no-cache", pragma === "no-cache");
  setSourceText("manifestExpires", "Expires", expires, "0", expires === "0");
}
