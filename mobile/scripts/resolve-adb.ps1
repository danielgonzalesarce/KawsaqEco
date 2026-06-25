# Resuelve la ruta de adb.exe (PATH o Android SDK en Windows).
function Resolve-AdbPath {
  $cmd = Get-Command adb -ErrorAction SilentlyContinue
  if ($cmd) { return $cmd.Source }

  $candidates = @(
    (Join-Path $env:LOCALAPPDATA 'Android\Sdk\platform-tools\adb.exe'),
    (Join-Path $env:USERPROFILE 'AppData\Local\Android\Sdk\platform-tools\adb.exe')
  )

  if ($env:ANDROID_HOME) {
    $candidates += (Join-Path $env:ANDROID_HOME 'platform-tools\adb.exe')
  }
  if ($env:ANDROID_SDK_ROOT) {
    $candidates += (Join-Path $env:ANDROID_SDK_ROOT 'platform-tools\adb.exe')
  }

  foreach ($path in $candidates) {
    if ($path -and (Test-Path $path)) { return $path }
  }

  return $null
}

$adbPath = Resolve-AdbPath
if (-not $adbPath) {
  Write-Host 'ERROR: adb no encontrado.' -ForegroundColor Red
  Write-Host 'Instala Android SDK platform-tools o agrega adb al PATH.' -ForegroundColor Yellow
  Write-Host 'Ruta esperada: %LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe' -ForegroundColor Gray
  exit 1
}

return $adbPath
