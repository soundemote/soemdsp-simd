function fallbackCopyTextToClipboard(text) {
  const fallback = document.createElement("textarea");
  fallback.value = text;
  fallback.setAttribute("readonly", "");
  fallback.style.position = "fixed";
  fallback.style.left = "-9999px";
  fallback.style.opacity = "0";
  document.body.append(fallback);
  fallback.focus();
  fallback.select();
  fallback.setSelectionRange(0, fallback.value.length);
  const copied = document.execCommand("copy");
  fallback.remove();
  if (!copied) {
    throw new Error("clipboard fallback failed");
  }
}

async function copyTextToClipboard(text) {
  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error("Clipboard API unavailable");
    }
    await navigator.clipboard.writeText(text);
  } catch (_error) {
    fallbackCopyTextToClipboard(text);
  }
}

async function copyNodeGraphRuntimeSketch() {
  const sketch = document.getElementById("nodeRuntimeSketch");
  const sketchStatus = document.getElementById("nodeRuntimeSketchStatus");
  const text = sketch?.textContent || "";
  if (!text || text === "waiting for graph") {
    if (sketchStatus) {
      sketchStatus.textContent = "nothing to copy";
      sketchStatus.className = "pill warn";
    }
    return;
  }
  try {
    await copyTextToClipboard(text);
    if (sketchStatus) {
      sketchStatus.textContent = "copied";
      sketchStatus.className = "pill good";
    }
  } catch (error) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(sketch);
    selection.removeAllRanges();
    selection.addRange(range);
    if (sketchStatus) {
      sketchStatus.textContent = "selected";
      sketchStatus.title = error.message;
      sketchStatus.className = "pill good";
    }
  }
}

async function copyNodeGraphExecutionJson() {
  const debug = document.getElementById("nodeExecutionPlanDebug");
  const jsonStatus = document.getElementById("nodeExecutionJsonStatus");
  const text = debug?.textContent || "";
  if (!text || text === "waiting for graph") {
    if (jsonStatus) {
      jsonStatus.textContent = "nothing to copy";
      jsonStatus.className = "pill warn";
    }
    return;
  }
  try {
    await copyTextToClipboard(text);
    if (jsonStatus) {
      jsonStatus.textContent = "copied";
      jsonStatus.className = "pill good";
    }
  } catch (error) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(debug);
    selection.removeAllRanges();
    selection.addRange(range);
    if (jsonStatus) {
      jsonStatus.textContent = "selected";
      jsonStatus.title = error.message;
      jsonStatus.className = "pill good";
    }
  }
}
