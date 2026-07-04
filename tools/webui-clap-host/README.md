# Soundemote WebUI CLAP Host Prototype

Local companion prototype for the WebUI CLAP host plan.

```powershell
python tools\webui-clap-host\webui_clap_host.py

# Windows launcher with metadata inspection enabled by default:
tools\webui-clap-host\start_webui_clap_host.cmd
tools\webui-clap-host\start_webui_clap_host.ps1

# Browser-visible checks:
# http://127.0.0.1:47991/health
# http://127.0.0.1:47991/version
# http://127.0.0.1:47991/plugins
# http://127.0.0.1:47991/diagnostics

# Optional alternate port:
python tools\webui-clap-host\webui_clap_host.py --port 48000
tools\webui-clap-host\start_webui_clap_host.cmd -Port 48000
tools\webui-clap-host\start_webui_clap_host.ps1 -Port 48000

# Optional explicit catalog entry:
python tools\webui-clap-host\webui_clap_host.py --plugin "C:\path\to\plugin.clap"
tools\webui-clap-host\start_webui_clap_host.cmd -Plugin "C:\path\to\plugin.clap"
tools\webui-clap-host\start_webui_clap_host.ps1 -Plugin "C:\path\to\plugin.clap"

# Optional native descriptor inspection:
python tools\webui-clap-host\webui_clap_host.py --inspect-metadata

# Optional create/init/destroy probe:
python tools\webui-clap-host\webui_clap_host.py --test-instantiate
tools\webui-clap-host\start_webui_clap_host.cmd -TestInstantiate
tools\webui-clap-host\start_webui_clap_host.ps1 -TestInstantiate

# Print a JSON preflight report and exit without starting the server:
python tools\webui-clap-host\webui_clap_host.py --doctor --inspect-metadata
```

Current instance API:

```text
GET /diagnostics
POST /instances
GET /instances
GET /instances/<id>/params
POST /instances/<id>/param
POST /instances/<id>/params
GET /instances/<id>/state
POST /instances/<id>/state
POST /instances/<id>/render/begin
POST /instances/<id>/process
POST /instances/<id>/render/end
POST /instances/<id>/editor/open
POST /instances/<id>/editor/close
POST /process-batch
POST /instances/<id>/safety/reset
DELETE /instances/<id>
```

Current boundary:

```text
This is a localhost API and catalog prototype only.
The host sends CORS headers and supports OPTIONS preflight for browser access from the sandbox server.
GET /health and GET /plugins report host capabilities.
GET /health also reports `hostConfig`: bind host, port, Python executable, host script path, working directory, scan dirs, explicit plugins, and probe flags.
GET /diagnostics reports `hostConfig`, scan path counts, plugin counts, loadable counts, metadata error counts, instantiation error counts, and missing explicit plugin paths.
The `--doctor` command prints the same host configuration plus catalog counts, metadata errors, instantiation errors, and missing explicit plugin paths as JSON without starting the HTTP server.
The capabilities include `maxProcessFrames`, `processBatch`, and `offlineRenderSessions`; the current host reports `48000` max process frames.
The threaded HTTP host serializes access to the instance table and serializes native work per CLAP instance.
It can discover .clap paths from scan folders and explicit --plugin paths.
With --inspect-metadata, it loads discovered CLAP libraries in isolated probe subprocesses and reads plugin descriptors.
With --test-instantiate, it creates, initializes, and destroys plugin instances inside isolated probe subprocesses.
The instance API can keep initialized plugin instances alive and read CLAP parameter metadata.
It can set parameter plain values through `clap.params.flush()`.
It can set multiple parameter plain values through one bulk `/params` write and one CLAP `params.flush()` call.
It can run a bounded offline process call and return output metrics.
If native `plugin.process()` returns `CLAP_PROCESS_ERROR`, the process call fails instead of returning audio.
The `/process` request may include a `parameters` array; those values are applied before chunk processing and reported as `processParameters`.
The `/render/begin` and `/render/end` routes keep a plugin activated and processing across Render Sample chunks.
Direct `/param` and `/params` writes are blocked while a render session is active; render-time parameter changes must use the `/process` `parameters` array.
Abandoned render sessions are released by an idle timeout reported as `renderSessionIdleTimeoutSeconds`.
A second `/render/begin` is rejected while a non-idle render session is active.
The `/process-batch` request accepts multiple bounded process items and returns one result per item.
Batch items are processed serially inside the host; the batch endpoint reduces localhost request overhead, not native scheduling complexity.
With `returnAudio: true`, it can return bounded planar float audio.
With `inputAudio`, it can process caller-supplied planar channel audio.
The `/process` audio formats are `planar-f32-json` and `planar-f32-base64`.
Each instance has a safety latch. Non-finite plugin output or raw output above the host peak limit mutes returned audio until `POST /instances/<id>/safety/reset`.
It exists so the browser sandbox can detect a local companion process, read a catalog, create instances, and read parameters.
The browser CLAP host strip has a Host field for the localhost URL.
The browser CLAP host strip can copy the Windows `.cmd` launcher command for the selected host and port.
The browser CLAP host strip can run Diagnostics against the selected host and display setup counts from `/diagnostics`.
The `/shutdown` route closes all instances and initiates threaded server shutdown. Undocumented experimental route; may be removed or guarded in later versions.
The Windows launcher validates the port, host script path, and Python command before starting.
The Windows launcher runs the host from the sandbox repository root for predictable relative paths.
The browser has a `CLAP Plugin` module shell that can select a catalog entry and request/delete a host instance.
The browser stores host capabilities from the health/catalog payloads.
After connecting, the browser reads `GET /instances` so existing host instance safety state can be shown.
If a patch has an instance id that the connected host no longer lists, the module marks it stale and offers `Forget Instance`.
The module can replace generic stereo ports with flattened CLAP audio lanes from every CLAP input/output port after instance creation.
The host can report per-instance `clap.gui` editor capability through `GET /instances/<id>/editor`.
The browser has `Open Editor` and `Close Editor` actions. On Windows, the host can open non-floating `win32` CLAP editors in a native parent window when the plugin supports that API and accepts the GUI create/show sequence.
The host can report per-instance `clap.latency` through summaries, process responses, and `GET /instances/<id>/latency`.
Render Sample compensates reported plugin latency when it injects returned CLAP output into the browser render.
The host can report per-instance `clap.tail` through summaries, process responses, and `GET /instances/<id>/tail`.
Render Sample can append bounded finite plugin-tail frames to the browser render. Infinite tails are reported as metadata and do not extend render length.
The host can save and load per-instance `clap.state` through `GET /instances/<id>/state` and `POST /instances/<id>/state`.
The browser can store saved CLAP state in patch JSON and restore it into a recreated host instance.
State save/load is blocked during an active offline render session.
The module can read host-owned CLAP parameters and write plain parameter values through the localhost host.
The browser stores CLAP parameter values and metadata in patch params/paramMeta after parameter refresh.
Stored patch parameter values are restored into the host instance during parameter refresh.
Host-discovered CLAP parameters expose sandbox modulation input ports and slider-output ports in the browser module.
Render Sample can use a bounded offline bridge to send CLAP Plugin input lanes to the host and inject returned audio lanes into the browser render.
Render Sample requires the connected host to report `audioProcessing: true`.
Render Sample requires the connected host to report `offlineRenderSessions: true`.
Render Sample uses the connected host's `maxProcessFrames` capability for CLAP process chunk size.
Render Sample uses `planar-f32-base64` for CLAP process input and returned audio.
Reachable CLAP Plugin nodes are processed chunk-by-chunk in graph order.
Current host processing uses all CLAP input and output ports, flattened in host port order with channels kept inside each port.
Render Sample opens one host render session per reachable CLAP Plugin instance before chunk processing and closes it afterward.
Independent CLAP Plugin nodes in the same render chunk can share one `/process-batch` request.
CLAP chains still advance in dependency order so upstream output is available before downstream input is computed.
CLAP input buffers are summed from incoming graph wires.
Already-processed upstream CLAP chunks are available to downstream CLAP nodes in the same offline pass.
Feedback connections and feedback modulations that touch CLAP Plugin nodes are blocked before host processing.
Before Render Sample process calls, effective CLAP parameter plain values are sent inside the `/process` request.
Sandbox modulation wires can target CLAP parameters during bounded offline Render Sample processing.
This parameter sync is chunk-start control-rate behavior, not sample-accurate CLAP automation.
Feedback-safe CLAP scheduling is not implemented yet.
Live Audio blocks plans with CLAP Plugin nodes instead of routing silent plugin output.
Live Audio does not route graph audio through the host yet.
Native CLAP editor hosting is implemented only for non-floating Win32 `clap.gui` editors in this prototype. Individual plugins may still reject or time out during their GUI callbacks.
Reported CLAP latency is compensated in Render Sample output injection.
Reported CLAP tails do not extend Render Sample output length yet.
```
