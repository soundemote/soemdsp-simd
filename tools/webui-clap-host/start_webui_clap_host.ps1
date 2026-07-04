param(
    [string]$Python = "python",
    [string]$BindHost = "127.0.0.1",
    [int]$Port = 47991,
    [string[]]$Plugin = @(),
    [string[]]$ScanDir = @(),
    [switch]$NoInspectMetadata,
    [switch]$TestInstantiate
)

$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RepoRoot = Split-Path -Parent (Split-Path -Parent $ScriptDir)
$HostScript = Join-Path $ScriptDir "webui_clap_host.py"

if ($Port -lt 1 -or $Port -gt 65535) {
    throw "Port must be in 1..65535."
}

if (-not (Test-Path -LiteralPath $HostScript)) {
    throw "Host script not found: $HostScript"
}

$PythonCommand = Get-Command $Python -ErrorAction Stop

$Arguments = @(
    $HostScript,
    "--host", $BindHost,
    "--port", [string]$Port
)

if (-not $NoInspectMetadata) {
    $Arguments += "--inspect-metadata"
}

foreach ($PluginPath in $Plugin) {
    if ($PluginPath) {
        $Arguments += @("--plugin", $PluginPath)
    }
}

foreach ($ScanDirPath in $ScanDir) {
    if ($ScanDirPath) {
        $Arguments += @("--scan-dir", $ScanDirPath)
    }
}

if ($TestInstantiate) {
    $Arguments += "--test-instantiate"
}

Write-Host "Starting Soundemote WebUI CLAP Host on http://${BindHost}:$Port"
Write-Host "$($PythonCommand.Source) $($Arguments -join ' ')"
Push-Location $RepoRoot
try {
    & $PythonCommand.Source @Arguments
}
finally {
    Pop-Location
}
