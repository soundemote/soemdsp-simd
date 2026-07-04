// "·  " is a middle dot plus two non-breaking spaces --
// rendered as part of the text itself (see renderNodeBootSysinfo) so it's
// present from the very first paint, not popped in later by CSS once the
// element stops being empty.
const NODE_BOOT_SYSINFO_PREFIX = "·  ";

function renderNodeBootSysinfo(parts) {
  const el = document.getElementById("nodeBootSysinfo");
  if (!el) return;
  const joined = parts.filter(Boolean).join("  |  ");
  el.textContent = joined ? NODE_BOOT_SYSINFO_PREFIX + joined : "";
}

// Only ever renders a finite, non-negative number -- a stray negative
// value (or NaN/Infinity from a probe that returned garbage) previously
// could land in the string with no guard at all, which is exactly the
// kind of thing that both looks broken and, if it ever changed a digit
// count between runs, changes the rendered width of the line.
function safeBootSysinfoNumber(value) {
  const num = Number(value);
  return Number.isFinite(num) && num >= 0 ? num : null;
}

function probeWebGLVRAM(gl) {
  // Safari/WebKit only extension
  try {
    const ext = gl.getExtension("WEBKIT_WEBGL_memory_info");
    if (ext) {
      const kb = gl.getParameter(ext.CURRENT_AVAILABLE_VIDMEM_WEBGL);
      if (kb > 0) return Math.round(kb / 1024);
    }
  } catch (_) {}
  // Probe by allocating textures until OOM — each 4096×4096 RGBA = 64 MB
  let mb = 0;
  const textures = [];
  try {
    for (let i = 0; i < 128; i++) {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 4096, 4096, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      if (gl.getError() !== gl.NO_ERROR) { gl.deleteTexture(tex); break; }
      textures.push(tex);
      mb += 64;
    }
  } catch (_) {}
  textures.forEach((t) => gl.deleteTexture(t));
  return mb || null;
}

function formatBootSysinfoVram(vramMB) {
  const safeVram = safeBootSysinfoNumber(vramMB);
  if (!safeVram) return null;
  return safeVram >= 1024 ? `${Math.round(safeVram / 1024)} GB VRAM` : `${safeVram} MB VRAM`;
}

// Tauri's WebView2 window can still report screen.width/height as 0 for a
// handful of frames after the page starts executing, before the OS has
// finished sizing the actual window -- polling a few animation frames
// before giving up (rather than reading once, immediately) is what fixes
// the "Screen: 0×0" case, not a formatting change.
function waitForBootScreenDimensions(maxAttempts = 30) {
  return new Promise((resolve) => {
    let attempts = 0;
    function attempt() {
      const width = safeBootSysinfoNumber(screen.width);
      const height = safeBootSysinfoNumber(screen.height);
      if ((width && height) || attempts >= maxAttempts) {
        resolve({
          width: width || safeBootSysinfoNumber(window.innerWidth) || null,
          height: height || safeBootSysinfoNumber(window.innerHeight) || null,
        });
        return;
      }
      attempts += 1;
      requestAnimationFrame(attempt);
    }
    attempt();
  });
}

async function populateNodeBootSysinfo() {
  const el = document.getElementById("nodeBootSysinfo");
  if (!el) return;
  // Placeholder text right away so the "· " prefix, and roughly the
  // final text's width, are on screen from first paint -- the real values
  // below replace this in place rather than growing the element from
  // empty, which is what caused the boot-time layout jitter.
  renderNodeBootSysinfo(["detecting system info…"]);

  // CPU core count is hidden for now -- feels too close to a fingerprinting
  // detail for users to be comfortable seeing on a loading screen.
  const cpuStr = null;

  // RAM
  const ramGB = safeBootSysinfoNumber(navigator.deviceMemory);
  const ramStr = ramGB ? `RAM: ${ramGB} GB` : null;

  // GPU from WebGL
  let gpuName = "";
  let vramMB = null;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    if (gl) {
      const ext = gl.getExtension("WEBGL_debug_renderer_info");
      if (ext) {
        gpuName = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) || "";
        // Strip boilerplate suffixes Chrome/D3D append
        gpuName = gpuName.replace(/\s*(Direct3D\S*|vs_\S+|ps_\S+|OpenGL\S*|Metal\s*\S*)/gi, "").trim();
      }
      vramMB = probeWebGLVRAM(gl);
    }
  } catch (_) {}

  // Try WebGPU for better GPU name and description
  let gpuStr = null;
  try {
    if (navigator.gpu) {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        let info = null;
        if (typeof adapter.requestAdapterInfo === "function") {
          info = await adapter.requestAdapterInfo();
        } else if (adapter.info) {
          info = adapter.info;
        }
        if (info) {
          const desc = info.description || info.device || gpuName;
          const vramStr = formatBootSysinfoVram(vramMB);
          const gpuParts = [vramStr, desc || gpuName].filter(Boolean);
          gpuStr = gpuParts.length ? `GPU: ${gpuParts.join(", ")}` : null;
        }
      }
    }
  } catch (_) {}

  if (!gpuStr) {
    const vramStr = formatBootSysinfoVram(vramMB);
    const gpuParts = [vramStr, gpuName].filter(Boolean);
    gpuStr = gpuParts.length ? `GPU: ${gpuParts.join(", ")}` : null;
  }

  // OS
  const platform = navigator.userAgentData?.platform || navigator.platform || "";
  const arch = navigator.userAgentData?.architecture || "";
  const osParts = [platform, arch].filter(Boolean);
  const osStr = osParts.length ? `OS: ${osParts.join(" ")}` : null;

  // Browser
  let browserStr = null;
  const brands = navigator.userAgentData?.brands;
  if (brands && brands.length) {
    const significant = brands.filter((b) => !/not.a.brand/i.test(b.brand));
    const brand = significant[significant.length - 1] || brands[brands.length - 1];
    if (brand) browserStr = `Browser: ${brand.brand} ${brand.version}`;
  } else {
    const ua = navigator.userAgent;
    const match = ua.match(/(Edg(?:e|)\/([\d]+)|Chrome\/([\d]+)|Firefox\/([\d]+)|Safari\/([\d]+))/);
    if (match) {
      const name = match[1].startsWith("Edg") ? "Edge" : match[1].startsWith("Chr") ? "Chrome" : match[1].startsWith("Fir") ? "Firefox" : "Safari";
      const ver = match[2] || match[3] || match[4] || match[5];
      browserStr = `Browser: ${name} ${ver}`;
    }
  }

  // Screen -- polls briefly for real dimensions (see waitForBootScreenDimensions)
  // instead of reading screen.width/height once, which is what previously
  // produced "Screen: 0×0" in the Tauri window before it finished sizing.
  const { width: screenWidth, height: screenHeight } = await waitForBootScreenDimensions();
  const rawDpr = safeBootSysinfoNumber(window.devicePixelRatio);
  const dpr = rawDpr ? Math.round(rawDpr * 100) / 100 : 1;
  const screenStr = screenWidth && screenHeight
    ? `Screen: ${screenWidth}×${screenHeight}${dpr !== 1 ? ` @${dpr}x` : ""}`
    : null;

  renderNodeBootSysinfo([cpuStr, gpuStr, ramStr, osStr, browserStr, screenStr]);
}

populateNodeBootSysinfo();

function setNodeBootLoadingProgress(value, label = "") {
  const fill = document.getElementById("nodeBootLoadingBarFill");
  const bar = document.querySelector(".node-boot-loading-bar");
  const labelElement = document.getElementById("nodeBootLoadingLabel");
  if (value != null) {
    const progress = Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
    if (bar) bar.setAttribute("aria-valuenow", String(progress));
    if (fill) fill.style.width = `${progress}%`;
  }
  if (label && labelElement) {
    labelElement.textContent = label;
    const messages = document.getElementById("nodeBootLoadingMessages");
    if (messages) {
      const line = document.createElement("div");
      line.className = "node-boot-loading-message";
      line.textContent = label;
      messages.prepend(line);
    }
  }
}

function finishNodeBootLoading() {
  if (!document.body.classList.contains("node-boot-loading")) {
    return;
  }
  if (typeof resetNodeGraphStartupView === "function") {
    resetNodeGraphStartupView();
  }
  setNodeBootLoadingProgress(100, "ready");
  document.body.dataset.nodeBootFinished = "interface-ready";
  document.body.classList.remove("node-boot-loading");
  document.body.classList.add("node-boot-fading");
  window.setTimeout(() => {
    document.body.classList.remove("node-boot-fading");
    document.body.classList.add("node-boot-ready");
  }, 333);
}

window.addEventListener("nodeSandboxStartupProgress", (event) => {
  setNodeBootLoadingProgress(event.detail?.progress, event.detail?.label);
});
window.addEventListener("nodeSandboxInterfaceReady", finishNodeBootLoading, { once: true });

window.setTimeout(() => {
  if (!document.body.classList.contains("node-boot-loading")) {
    return;
  }
  setNodeBootLoadingProgress(100, "ready");
  document.body.dataset.nodeBootFinished = "watchdog";
  finishNodeBootLoading();
}, 10000);

if (window.nodeSandboxInterfaceReady) {
  finishNodeBootLoading();
}
