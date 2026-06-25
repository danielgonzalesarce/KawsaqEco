# Mata procesos en el puerto (Metro viejo).
param([int]$Port = 8081)

$connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
foreach ($c in $connections) {
  $procId = $c.OwningProcess
  if ($procId -and $procId -ne 0) {
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    Write-Host "Puerto $Port liberado (PID $procId)" -ForegroundColor Yellow
  }
}
