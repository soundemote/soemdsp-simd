# Builds the Python server into a single-file sidecar exe for Tauri.
# Run from anywhere: scripts\build_sidecar.ps1
# Requires: Python 3, Rust (rustc, for the target-triple suffix).

param([string]$Python = "python")
$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$bin = Join-Path $root "src-tauri\binaries"
New-Item -ItemType Directory -Force -Path $bin | Out-Null

& $Python -m pip install --upgrade pyinstaller

& $Python -m PyInstaller `
    --onefile `
    --name soemdsp-server `
    --distpath (Join-Path $bin "dist") `
    --workpath (Join-Path $bin "work") `
    --specpath $bin `
    --noconfirm `
    (Join-Path $root "server.py")

# Tauri expects sidecars named <name>-<target-triple>.exe
$triple = ((& rustc -Vv | Select-String "^host:") -split "\s+")[1]
if (-not $triple) { throw "Could not determine target triple from rustc. Is Rust installed?" }

Copy-Item (Join-Path $bin "dist\soemdsp-server.exe") (Join-Path $bin "soemdsp-server-$triple.exe") -Force
Write-Host ""
Write-Host "Sidecar ready: src-tauri\binaries\soemdsp-server-$triple.exe"
