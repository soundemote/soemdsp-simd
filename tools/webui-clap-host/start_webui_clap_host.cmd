@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_webui_clap_host.ps1" %*
exit /b %ERRORLEVEL%
