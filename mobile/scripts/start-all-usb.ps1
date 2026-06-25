# Backend + Metro con tunel USB (todo en uno)
$root = Join-Path $PSScriptRoot '..'
$backend = Join-Path (Split-Path $root -Parent) 'backend'
$adb = & (Join-Path $PSScriptRoot 'resolve-adb.ps1')

Write-Host ''
Write-Host '=== KawsaqEco - arranque USB ===' -ForegroundColor Green
Write-Host ('adb: ' + $adb) -ForegroundColor Gray
Write-Host ''

$devices = & $adb devices | Select-String '\tdevice$'
if (-not $devices) {
  Write-Host 'ERROR: Conecta el celular por USB con Depuracion USB activa.' -ForegroundColor Red
  & $adb devices
  exit 1
}

$serial = & (Join-Path $PSScriptRoot 'select-adb-device.ps1') -Quiet
if (-not $serial) { exit 1 }
Write-Host ('Celular: ' + $serial) -ForegroundColor Cyan

& (Join-Path $PSScriptRoot 'adb-reverse.ps1')
if ($LASTEXITCODE -ne 0) { exit 1 }

& (Join-Path $PSScriptRoot 'kill-port.ps1') -Port 8081

$backendCmd = "cd '$backend'; .\venv\Scripts\activate; uvicorn main:app --reload --port 8000 --host 0.0.0.0"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd
Write-Host 'Backend iniciado en ventana nueva.' -ForegroundColor Cyan

Start-Sleep -Seconds 2

$env:EXPO_PUBLIC_API_URL = 'http://127.0.0.1:8000'
$env:REACT_NATIVE_PACKAGER_HOSTNAME = 'localhost'
$env:ANDROID_SERIAL = $serial
Set-Location $root
Write-Host 'Abre KawsaqEco en el celular o pulsa a en esta terminal.' -ForegroundColor Gray
npx expo start --dev-client --clear
