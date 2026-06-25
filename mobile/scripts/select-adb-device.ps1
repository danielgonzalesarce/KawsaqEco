# Selecciona celular fisico USB y desconecta emuladores offline.
param(
  [switch]$Quiet
)

$adb = & (Join-Path $PSScriptRoot 'resolve-adb.ps1')

# Quitar emuladores offline que confunden a Expo (error puerto 5554)
$offline = @(& $adb devices | Select-String '\toffline$')
foreach ($line in $offline) {
  $s = ($line -split '\t')[0].Trim()
  if ($s) {
    & $adb disconnect $s 2>$null
    if (-not $Quiet) {
      Write-Host ("Emulador offline desconectado: " + $s) -ForegroundColor Yellow
    }
  }
}

$lines = @(& $adb devices | Select-String '\tdevice$')
if (-not $lines) {
  Write-Host 'ERROR: No hay celular conectado. Revisa cable y Depuracion USB.' -ForegroundColor Red
  & $adb devices
  exit 1
}

$serials = @($lines | ForEach-Object { ($_ -split '\t')[0].Trim() })
$serial = ($serials | Where-Object { $_ -notmatch '^emulator-' } | Select-Object -First 1)
if (-not $serial) { $serial = $serials[0] }

if ($serials.Count -gt 1 -and -not $Quiet) {
  Write-Host ("Dispositivo seleccionado: " + $serial) -ForegroundColor Cyan
}

# Expo/adb usan esta variable para no apuntar al emulador
$env:ANDROID_SERIAL = $serial

return $serial
