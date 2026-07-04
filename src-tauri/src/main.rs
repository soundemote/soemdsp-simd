// SoundEmote Sandbox - native desktop wrapper.
//
// Opens a launcher (Solo / Host / Join). Solo and Host spawn the bundled
// PyInstaller sidecar (`soemdsp-server`); Host binds it to 0.0.0.0 so other
// machines on the LAN can join the same workspace (from this app or any
// browser). Join simply navigates to a remote host's URL.

#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::io;
use std::net::{SocketAddr, TcpStream, UdpSocket};
use std::path::{Path, PathBuf};
use std::sync::Mutex;
use std::thread;
use std::time::{Duration, Instant};

use serde::Serialize;
use tauri::{Manager, RunEvent};
use tauri_plugin_shell::process::CommandChild;
use tauri_plugin_shell::ShellExt;

const PORT: u16 = 8765;

struct ServerChild(Mutex<Option<CommandChild>>);

#[derive(Serialize)]
struct HostInfo {
    /// URL this window should navigate to.
    url: String,
    /// URL other people on the LAN should use (None if IP detection failed).
    share_url: Option<String>,
}

fn copy_dir_all(src: &Path, dst: &Path) -> io::Result<()> {
    fs::create_dir_all(dst)?;
    for entry in fs::read_dir(src)? {
        let entry = entry?;
        let to = dst.join(entry.file_name());
        if entry.file_type()?.is_dir() {
            copy_dir_all(&entry.path(), &to)?;
        } else {
            fs::copy(entry.path(), &to)?;
        }
    }
    Ok(())
}

/// Sync bundled read-only resources (public/, native_modules/) into a
/// writable per-user data dir whenever the bundled VERSION changes.
/// saved-patches are seeded once and never clobbered afterwards.
fn ensure_data_root(app: &tauri::AppHandle) -> io::Result<PathBuf> {
    let data_root = app
        .path()
        .app_data_dir()
        .expect("app data dir unavailable")
        .join("sandbox-data");
    let resource_root = app
        .path()
        .resource_dir()
        .expect("resource dir unavailable")
        .join("sandbox-data");

    let bundled = fs::read_to_string(resource_root.join("VERSION")).unwrap_or_default();
    let installed = fs::read_to_string(data_root.join("VERSION")).unwrap_or_default();

    if bundled.trim().is_empty() || bundled.trim() != installed.trim() {
        for dir in ["public", "native_modules"] {
            let dst = data_root.join(dir);
            if dst.exists() {
                fs::remove_dir_all(&dst)?;
            }
            copy_dir_all(&resource_root.join(dir), &dst)?;
        }
        let patches = data_root.join("saved-patches");
        if !patches.exists() {
            copy_dir_all(&resource_root.join("saved-patches"), &patches)?;
        }
        fs::write(data_root.join("VERSION"), bundled.trim())?;
    }
    Ok(data_root)
}

/// Dev builds serve straight from the source tree so public/ edits are live.
/// Release builds serve from the synced per-user data dir.
fn sandbox_root(app: &tauri::AppHandle) -> io::Result<PathBuf> {
    if cfg!(debug_assertions) {
        Ok(PathBuf::from(env!("CARGO_MANIFEST_DIR"))
            .parent()
            .expect("src-tauri has a parent dir")
            .to_path_buf())
    } else {
        ensure_data_root(app)
    }
}

fn wait_for_server(timeout: Duration) -> bool {
    let addr: SocketAddr = format!("127.0.0.1:{PORT}")
        .parse()
        .expect("bad server address");
    let start = Instant::now();
    while start.elapsed() < timeout {
        if TcpStream::connect_timeout(&addr, Duration::from_millis(500)).is_ok() {
            return true;
        }
        thread::sleep(Duration::from_millis(250));
    }
    false
}

fn spawn_server(app: &tauri::AppHandle, bind_host: &str) -> Result<(), String> {
    // Kill a previously spawned server (e.g. user re-picks a mode later).
    if let Some(old) = app.state::<ServerChild>().0.lock().unwrap().take() {
        let _ = old.kill();
        thread::sleep(Duration::from_millis(300));
    }

    let root = sandbox_root(app).map_err(|e| format!("data dir error: {e}"))?;
    let sidecar = app
        .shell()
        .sidecar("soemdsp-server")
        .map_err(|e| format!("sidecar missing: {e}"))?
        .env("SOEMDSP_SANDBOX_ROOT", root.to_string_lossy().to_string())
        .args(["--host", bind_host, "--port", &PORT.to_string()]);
    let (_rx, child) = sidecar
        .spawn()
        .map_err(|e| format!("failed to start server: {e}"))?;
    *app.state::<ServerChild>().0.lock().unwrap() = Some(child);

    // PyInstaller onefile self-extracts on first launch; allow time.
    if wait_for_server(Duration::from_secs(30)) {
        Ok(())
    } else {
        Err(format!("server did not come up on port {PORT}"))
    }
}

/// Best-effort LAN IP: no traffic is sent; connecting a UDP socket just
/// asks the OS which local interface would route out.
fn lan_ip() -> Option<String> {
    let socket = UdpSocket::bind("0.0.0.0:0").ok()?;
    socket.connect("8.8.8.8:80").ok()?;
    Some(socket.local_addr().ok()?.ip().to_string())
}

#[tauri::command]
async fn launch_solo(app: tauri::AppHandle) -> Result<String, String> {
    spawn_server(&app, "127.0.0.1")?;
    Ok(format!("http://127.0.0.1:{PORT}/"))
}

#[tauri::command]
async fn launch_host(app: tauri::AppHandle) -> Result<HostInfo, String> {
    spawn_server(&app, "0.0.0.0")?;
    Ok(HostInfo {
        url: format!("http://127.0.0.1:{PORT}/"),
        share_url: lan_ip().map(|ip| format!("http://{ip}:{PORT}/")),
    })
}

fn main() {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .manage(ServerChild(Mutex::new(None)))
        .invoke_handler(tauri::generate_handler![launch_solo, launch_host])
        .build(tauri::generate_context!())
        .expect("error while building tauri application");

    app.run(|handle, event| {
        if let RunEvent::Exit = event {
            if let Some(child) = handle.state::<ServerChild>().0.lock().unwrap().take() {
                let _ = child.kill();
            }
        }
    });
}
