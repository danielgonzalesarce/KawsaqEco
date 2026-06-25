# Inicia Metro + API para celular en la misma Wi-Fi (sin USB).
$ip = (
  Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue |
  Where-Object {
    $_.InterfaceAlias -match 'Wi-Fi|WLAN|inal' -and
    $_.IPAddress -notmatch '^169\.254\.' -and
    $_.IPAddress -notmatch '^127\.'
  } |
  Select-Object -First 1
).IPAddress

if (-not $ip) {
  Write-Host 'No se encontro IP Wi-Fi. Ejecuta: ipconfig' -ForegroundColor Red
  exit 1
}

$metroUrl = 'http://' + $ip + ':8081'
$apiUrl = 'http://' + $ip + ':8000'

Write-Host ''
Write-Host '=== KawsaqEco - modo Wi-Fi ===' -ForegroundColor Green
Write-Host ('IP de esta PC: ' + $ip)
Write-Host ('Metro:  ' + $metroUrl)
Write-Host ('API:    ' + $apiUrl)
Write-Host ''
Write-Host 'En el celular:' -ForegroundColor Yellow
Write-Host '  1. Abre la app KawsaqEco (development build)'
Write-Host ('  2. Si no carga: agita el celular, Configure bundler, pon ' + $ip + ':8081')
Write-Host '  3. O escanea el QR de abajo'
Write-Host ''

$env:REACT_NATIVE_PACKAGER_HOSTNAME = $ip
$env:EXPO_PUBLIC_API_URL = $apiUrl

Set-Location (Join-Path $PSScriptRoot '..')
& (Join-Path $PSScriptRoot 'kill-port.ps1') -Port 8081
npx expo start --dev-client --clear --host lan
