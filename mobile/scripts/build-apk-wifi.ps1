# Genera APK con JS incluido — funciona en Wi-Fi sin Metro.
# Instala el APK en el celular (WhatsApp, Drive, USB).
$root = Split-Path $PSScriptRoot -Parent

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

$env:EXPO_PUBLIC_API_URL = 'http://' + $ip + ':8000'
Write-Host ''
Write-Host '=== Compilando APK (JS embebido + API Wi-Fi) ===' -ForegroundColor Green
Write-Host ('API en el APK: http://' + $ip + ':8000')
Write-Host 'Puede tardar 15-40 min la primera vez...'
Write-Host ''

Set-Location (Join-Path $root 'android')
.\gradlew.bat assembleDebug

$apk = Join-Path $root 'android\app\build\outputs\apk\debug\app-debug.apk'
if (Test-Path $apk) {
  Write-Host ''
  Write-Host 'APK listo:' -ForegroundColor Green
  Write-Host $apk
  Write-Host ''
  Write-Host 'Instala en el Samsung y arranca solo el backend en la PC.' -ForegroundColor Yellow
} else {
  Write-Host 'Error: no se genero el APK.' -ForegroundColor Red
  exit 1
}
