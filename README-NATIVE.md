# SoundEmote Sandbox — Native Desktop App (Tauri)

Wraps the sandbox (Python server + web UI) in a Tauri 2 shell so people can
download a normal installer instead of cloning a repo.

## How it works

- The app opens a **launcher**: Solo / Host / Join.
  - **Solo** — spawns the bundled server on `127.0.0.1:8765`, private to this machine.
  - **Host** — spawns it on `0.0.0.0:8765` so anyone on your LAN can join the
    same workspace at `http://<your-ip>:8765/` — from this app (Join) or any browser.
  - **Join** — no local server; the window just navigates to the host's address.
- `scripts\build_sidecar.ps1` packs `server.py` into a single-file exe with
  PyInstaller (`src-tauri\binaries\soemdsp-server-<triple>.exe`). The app
  spawns/kills it automatically.
- `public/`, `native_modules/`, `saved-patches/` and `VERSION` are bundled as
  resources and synced on first run (or version change) into a writable
  per-user folder (`%APPDATA%\io.soundemote.sandbox\sandbox-data`). The server
  is pointed there via the `SOEMDSP_SANDBOX_ROOT` env var (small patch in
  `server.py`). User patches are never overwritten by updates.

## Prerequisites (one-time)

- Python 3 (already required by the sandbox)
- Rust: https://rustup.rs
- Tauri CLI: `cargo install tauri-cli --locked`
- Windows: WebView2 runtime (preinstalled on Win 10/11)

## Build the installer

```powershell
# 1. Build the Python sidecar (rerun whenever server.py changes)
scripts\build_sidecar.ps1

# 2. Build the app + NSIS installer
cd src-tauri
cargo tauri build
```

Installer lands in `src-tauri\target\release\bundle\nsis\`.

## Dev mode

```powershell
# Sidecar must exist first (once, and after server.py changes):
scripts\build_sidecar.ps1

cd src-tauri
cargo tauri dev
```

Dev builds serve straight from the source tree (`public/` edits are live);
release builds serve from the synced per-user data dir.

## Hosting notes / caveats

- First time you pick **Host**, Windows Firewall will ask to allow
  `soemdsp-server` — accept for private networks.
- Hosting exposes the full sandbox API (patch save, audio upload, etc.) to
  everyone on the LAN. There is no auth. Only host on networks you trust.
- Real-time collaborative editing (parameter sync between people in the same
  workspace) additionally requires the multiplayer patch-system branch
  (`digital-efficient-patch-system`) to be merged in — Host mode without it
  shares the workspace/patches but not live edits.
- Internet (non-LAN) hosting would need port forwarding or a hosted relay —
  out of scope for now.

## Next steps / fun stuff

- Auto-updater (`tauri-plugin-updater`) so downloads stay fresh
- macOS/Linux builds (same layout; sidecar script needs a bash twin)
- Android/iOS via Tauri 2 mobile targets
- Native menus, file-dialog patch import/export, deep links (`soemdsp://`)
