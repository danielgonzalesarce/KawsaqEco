# Backend + Metro + app en emulador Android (API 10.0.2.2)
$root = Join-Path $PSScriptRoot '..'
$backend = Join-Path (Split-Path $root -Parent) 'backend'
$adb = & (Join-Path $PSScriptRoot 'resolve-adb.ps1')

Write-Host ''
Write-Host '=== KawsaqEco - emulador Android ===' -ForegroundColor Green
Write-Host ('adb: ' + $adb) -ForegroundColor Gray
Write-Host ''

$lines = @(& $adb devices | Select-String '\tdevice$')
$serial = ($lines | ForEach-Object { ($_ -split '\t')[0].Trim() } | Where-Object { $_ -match '^emulator-' } | Select-Object -First 1)
if (-not $serial) {
  $serial = ($lines | ForEach-Object { ($_ -split '\t')[0].Trim() } | Select-Object -First 1)
}
if (-not $serial) {
  Write-Host 'ERROR: Abre un emulador en Android Studio (AVD Manager).' -ForegroundColor Red
  & $adb devices
  exit 1
}

Write-Host ('Dispositivo: ' + $serial) -ForegroundColor Cyan
& $adb -s $serial reverse tcp:8000 tcp:8000
& $adb -s $serial reverse tcp:8081 tcp:8081
Write-Host 'Tunel emulador listo (8000 + 8081).' -ForegroundColor Cyan

& (Join-Path $PSScriptRoot 'kill-port.ps1') -Port 8081

$backendCmd = "cd '$backend'; .\venv\Scripts\activate; uvicorn main:app --reload --port 8000 --host 0.0.0.0"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd
Write-Host 'Backend iniciado en ventana nueva.' -ForegroundColor Cyan

Start-Sleep -Seconds 2

$env:EXPO_PUBLIC_API_URL = 'http://10.0.2.2:8000'
$env:REACT_NATIVE_PACKAGER_HOSTNAME = '10.0.2.2'
Set-Location $root
Write-Host 'Iniciando Metro y abriendo en emulador...' -ForegroundColor Cyan
npx expo start --android --dev-client --clear
