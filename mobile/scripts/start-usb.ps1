# Metro + tunel USB (adb reverse) para KawsaqEco
$root = Join-Path $PSScriptRoot '..'
$adb = & (Join-Path $PSScriptRoot 'resolve-adb.ps1')

Write-Host ''
Write-Host '=== KawsaqEco - modo USB ===' -ForegroundColor Green
Write-Host ('adb: ' + $adb) -ForegroundColor Gray
Write-Host 'Conecta el celular por cable y activa Depuracion USB.'
Write-Host ''

$devices = & $adb devices | Select-String '\tdevice$'
if (-not $devices) {
  Write-Host 'ERROR: No hay celular conectado. Revisa cable y Depuracion USB.' -ForegroundColor Red
  & $adb devices
  exit 1
}

$serial = & (Join-Path $PSScriptRoot 'select-adb-device.ps1') -Quiet
if (-not $serial) { exit 1 }
Write-Host ('Celular: ' + $serial) -ForegroundColor Cyan

Write-Host 'Configurando tunel USB...' -ForegroundColor Cyan
& (Join-Path $PSScriptRoot 'adb-reverse.ps1')
if ($LASTEXITCODE -ne 0) { exit 1 }
Write-Host '  127.0.0.1:8000 -> PC (backend)' -ForegroundColor Gray
Write-Host '  127.0.0.1:8081 -> PC (Metro)' -ForegroundColor Gray
Write-Host ''

& (Join-Path $PSScriptRoot 'kill-port.ps1') -Port 8081

$env:EXPO_PUBLIC_API_URL = 'http://127.0.0.1:8000'
$env:REACT_NATIVE_PACKAGER_HOSTNAME = 'localhost'
$env:ANDROID_SERIAL = $serial

Set-Location $root
Write-Host 'Iniciando Metro...' -ForegroundColor Cyan
Write-Host 'Abre KawsaqEco en el celular o pulsa a en esta terminal.' -ForegroundColor Gray
npx expo start --dev-client --clear
