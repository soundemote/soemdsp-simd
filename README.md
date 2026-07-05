# 🧵 soemdsp-simd

**The SIMD department of Soundemote's soemdsp-research division** — a
browser-based modular audio synthesis sandbox forked from
[soemdsp-sandbox](https://github.com/soundemote/soemdsp-sandbox) to dig into
vectorization and low-level performance work on native C++/WASM DSP modules.
Patch modules together, watch waveforms render live, and hear the result
instantly. No install, no build step, just a Python file server and a
browser.

### 🌐 Parent project — [soemdsp-sandbox](https://github.com/soundemote/soemdsp-sandbox)

---

## ✨ What's inside

- 🔊 **Live Audio** — patch modules together and hear them in real time via
  an AudioWorklet-driven graph.
- 🧩 **Native DSP modules** — oscillators, filters, envelopes, reverbs, and
  chaos generators compiled from C++ to WASM.
- 📈 **Render Sample** — bounce a patch to audio and inspect the waveform.
- 🔌 **CLAP host prototype** — a localhost companion that can probe and host
  real CLAP plugins inside the sandbox graph.

---

## 🚀 Quick start

```powershell
# Requirements:
# - Python 3
# - A modern browser
# No package install is required for the sandbox server.

# Download:
git clone https://github.com/soundemote/soemdsp-simd.git
cd soemdsp-simd

# Run:
python server.py

# Open:
# http://127.0.0.1:8765

# Stop:
# Ctrl+C

# Test:
python scripts\smoke_test.py
```

<details>
<summary>⚙️ Optional artifact packet</summary>

```powershell
# Use this only if the sibling soemdsp repo is built locally.
C:\Users\argit\Documents\_PROGRAMMING\soemdsp\build-moved\examples\Debug\runtime_dsp_object_bound_wav_resync_demo.exe
python server.py
```

</details>

<details>
<summary>🎚️ Optional CLAP host prototype</summary>

```powershell
# Localhost companion prototype for CLAP catalog and instance probes.
# Render Sample has a bounded CLAP bridge.
# Feedback touching CLAP nodes and Live Audio CLAP plans are blocked for now.
python tools\webui-clap-host\webui_clap_host.py

# Windows launcher, metadata inspection on by default:
tools\webui-clap-host\start_webui_clap_host.cmd
tools\webui-clap-host\start_webui_clap_host.ps1

# Optional alternate bind port:
python tools\webui-clap-host\webui_clap_host.py --port 48000
tools\webui-clap-host\start_webui_clap_host.cmd -Port 48000
tools\webui-clap-host\start_webui_clap_host.ps1 -Port 48000

# Optional explicit catalog entry:
python tools\webui-clap-host\webui_clap_host.py --plugin "C:\path\to\plugin.clap"

# Optional native descriptor inspection:
python tools\webui-clap-host\webui_clap_host.py --inspect-metadata

# Optional create/init/destroy probe:
python tools\webui-clap-host\webui_clap_host.py --test-instantiate

# Optional JSON preflight report without starting the server:
python tools\webui-clap-host\webui_clap_host.py --doctor --inspect-metadata

# In the sandbox browser:
# Edit the Host field if the companion is not using http://127.0.0.1:47991.
# Click Copy Host Command if you need the Windows .cmd launcher command.
# Click Connect Local Host.
# Click Diagnostics to read setup counts from the running host.
# Click Refresh Plugins to read the host catalog.
# Add a CLAP Plugin module to store a selected catalog entry.

# Prototype instance API:
# GET /health reports host capabilities.
# GET /health also reports hostConfig: bind host, port, Python executable, scan dirs, explicit plugins, and probe flags.
# GET /diagnostics reports hostConfig, catalog counts, metadata errors, instantiation errors, and missing explicit plugin paths.
# --doctor reports hostConfig, catalog counts, metadata errors, instantiation errors, and missing explicit plugin paths as JSON.
# Capabilities include maxProcessFrames, processBatch, and offlineRenderSessions.
# Current maxProcessFrames default is 48000.
# POST /instances
# GET /instances
# GET /instances/<id>/params
# POST /instances/<id>/param
# POST /instances/<id>/params
# GET /instances/<id>/editor
# POST /instances/<id>/editor/open
# POST /instances/<id>/editor/close
# GET /instances/<id>/latency
# GET /instances/<id>/tail
# GET /instances/<id>/state
# POST /instances/<id>/state
# POST /instances/<id>/render/begin
# POST /instances/<id>/process
# POST /instances/<id>/render/end
# POST /process-batch
# /process can accept and return bounded planar-f32-base64 audio.
# /process can apply a parameters array before processing the chunk.
# CLAP_PROCESS_ERROR fails the process call instead of returning audio.
# Direct /param and /params writes are blocked while a render session is active.
# Abandoned render sessions are released by an idle timeout.
# A second render/begin is rejected while a non-idle render session is active.
# Render Sample opens one render session per CLAP instance, processes chunks, then closes the session.
# Render Sample requires audioProcessing: true from the host.
# Render Sample requires offlineRenderSessions: true from the host.
# Render Sample uses maxProcessFrames for CLAP process chunk size.
# WebUI CLAP audio lanes flatten every CLAP audio port in host port order.
# CLAP editor status can be detected; supported Win32 clap.gui editors can open when the plugin accepts the GUI sequence.
# CLAP latency is compensated when Render Sample injects returned CLAP output.
# Finite CLAP tails can extend Render Sample up to the bounded tail limit; infinite tails remain metadata-only.
# CLAP state can be saved into patch JSON and restored into a new host instance when the plugin exposes clap.state.
# Reachable CLAP nodes are processed chunk-by-chunk in graph order.
# Independent CLAP nodes in the same chunk can share one batch request.
# POST /instances/<id>/safety/reset
# DELETE /instances/<id>
```

</details>

---

## 🧵 About this fork

This is one of several themed sandbox forks under soemdsp-research, each a
self-contained detour into a specific DSP idea. This one's focus:
**vectorization and low-level performance** — a methodical dig into the
parameter/smoothing architecture and the native module dispatch path,
looking for measured wins (e.g. skipping recomputation on settled
parameters, SIMD-friendly data layouts) rather than speculative rewrites.

Sibling forks worth a look:

| Fork | What makes it worth a click |
|---|---|
| 🌊 [**Aliasing Wars**](https://github.com/elanhickler/soemdsp-sandbox-aliasing-wars) | Anti-aliases a hard-sync oscillator with reused PolyBLEP and sub-sample sync timing, proven out via a 27-assertion WASM test harness. |
| 💡 [**Vactrols**](https://github.com/elanhickler/soemdsp-sandbox-vactrols) | Grounds the vactrol envelope modules in real photoconductor physics, backed by actual recordings of hardware vactrols under CV control. |
| 🔢 [**Digital Signals**](https://github.com/elanhickler/soemdsp-sandbox-digital-signals-audio) | Asks what happens if patch wires carry packed bits instead of a continuous voltage — down to an FPGA-inspired LUT Cell module. |
| 📺 [**Phosphor**](https://github.com/elanhickler/soemdsp-sandbox-phosphor) | Rebuilds the scope renderers on real CRT-phosphor decay physics, with a hand-curated gallery of oscilloscope glow references. |
| ⚡ [**Digital Efficient Patch System**](https://github.com/elanhickler/soemdsp-sandbox-digital-efficient-patch-system) | Chases real-time multiplayer patch editing, with a brutally honest, phase-by-phase log of profiling dead ends before finding the actual bottleneck. |
| 🐾 [**Creatures**](https://github.com/elanhickler/soemdsp-sandbox-creatures) | A patchable virtual pet that eats your audio signal and reacts with eight moods, from Peaceful to Meltdown on a harsh clipped signal. |
| 🎚️ [**Analog Filters**](https://github.com/elanhickler/soemdsp-sandbox-analog-filters) | Models classic analog filter circuits (Moog ladder, ZDF/TPT feedback) closely enough that their self-oscillating, saturating personality falls out for free. |

---

## 📄 License

This repository is source-available for noncommercial use only. Commercial
use requires a separate written commercial license from Soundemote. See
[`LICENSE`](LICENSE).

---

## 📚 Guides

- [`docs/ADDING_HARDCODED_SANDBOX_MODULE.md`](docs/ADDING_HARDCODED_SANDBOX_MODULE.md)
- [`docs/OSC_MODULE_NON_UI_REFERENCE.md`](docs/OSC_MODULE_NON_UI_REFERENCE.md)
- [`docs/WEBUI_CLAP_HOST_PLAN.md`](docs/WEBUI_CLAP_HOST_PLAN.md)
- [`tools/webui-clap-host/README.md`](tools/webui-clap-host/README.md)

## 🧭 Boundaries

- The server only writes through explicit save/settings/audio helper routes.
- Open Path is restricted to Downloads.
- The browser patch graph is demo-scoped state.
- The browser compiler is not the production soemdsp scheduler.
- The WebUI does not instantiate real C++ DSP objects yet.
- Patch files can save current module instances and settings.
- Patch files cannot define new module types by themselves.
