# Ejecutar PowerShell COMO ADMINISTRADOR (una sola vez).
# Permite que el celular en Wi-Fi acceda a Metro (8081) y al backend (8000).

New-NetFirewallRule -DisplayName "KawsaqEco Metro 8081" -Direction Inbound -Protocol TCP -LocalPort 8081 -Action Allow -ErrorAction SilentlyContinue
New-NetFirewallRule -DisplayName "KawsaqEco API 8000" -Direction Inbound -Protocol TCP -LocalPort 8000 -Action Allow -ErrorAction SilentlyContinue

Write-Host "Reglas de firewall agregadas (8081 y 8000)." -ForegroundColor Green
