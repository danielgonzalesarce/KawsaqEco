# Configura adb reverse en el dispositivo USB correcto (evita error con multiples devices).
param(
  [int[]]$Ports = @(8000, 8081)
)

$adb = & (Join-Path $PSScriptRoot 'resolve-adb.ps1')
$serial = & (Join-Path $PSScriptRoot 'select-adb-device.ps1')
if ($LASTEXITCODE -ne 0) { exit 1 }

$lines = @($serial)
if (-not $lines -or -not $serial) {
  Write-Host 'ERROR: No hay celular conectado. Revisa cable y Depuracion USB.' -ForegroundColor Red
  & $adb devices
  exit 1
}

foreach ($port in $Ports) {
  & $adb -s $serial reverse "tcp:$port" "tcp:$port"
  if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: adb reverse fallo en puerto $port" -ForegroundColor Red
    exit 1
  }
}

Write-Host 'Tunel USB listo (8000 + 8081).' -ForegroundColor Cyan
