# Backend + Metro Wi-Fi — arranque completo para KawsaqEco
$root = Split-Path $PSScriptRoot -Parent
$backend = Join-Path (Split-Path $root -Parent) 'backend'

$ip = (
  Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object {
    $_.InterfaceAlias -match 'Wi-Fi|WLAN|inal' -and
    $_.IPAddress -notmatch '^169\.254\.' -and
    $_.IPAddress -notmatch '^127\.'
  } |
  Select-Object -First 1
).IPAddress

if (-not $ip) { $ip = '192.168.18.30' }

Write-Host ''
Write-Host '=== KawsaqEco — arranque completo ===' -ForegroundColor Green
Write-Host ('IP PC: ' + $ip)
Write-Host ('API:   http://' + $ip + ':8000')
Write-Host ''

# Liberar Metro
& (Join-Path $PSScriptRoot 'kill-port.ps1') -Port 8081
& (Join-Path $PSScriptRoot 'kill-port.ps1') -Port 8082

# Backend en ventana nueva
$backendCmd = "cd '$backend'; .\venv\Scripts\activate; uvicorn main:app --reload --port 8000 --host 0.0.0.0"
Start-Process powershell -ArgumentList '-NoExit', '-Command', $backendCmd
Write-Host 'Backend iniciado en ventana nueva.' -ForegroundColor Cyan

Start-Sleep -Seconds 2

# Metro (opcional si usas APK con JS embebido)
$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
$env:EXPO_PUBLIC_API_URL = 'http://' + $ip + ':8000'
Set-Location $root
Write-Host 'Iniciando Metro (opcional para recarga en caliente)...' -ForegroundColor Cyan
npx expo start --dev-client --clear --host lan
