# Guía rápida para corregir DEVELOPER_ERROR de Google Sign-In en Android.
$ErrorActionPreference = "Continue"

$sha1Formatted = "34:85:39:8D:1D:C7:47:E9:9B:1C:AB:04:F9:AD:D3:81:BF:DB:3F:90"
$firebaseUrl = "https://console.firebase.google.com/project/kawsaqeco/settings/general"
$googleClientsUrl = "https://console.cloud.google.com/apis/credentials?project=932892906896"

Write-Host ""
Write-Host "=== Configurar Google Sign-In (Android) ===" -ForegroundColor Green
Write-Host ""
Write-Host "El error DEVELOPER_ERROR significa que falta la huella SHA-1 en Firebase/Google Cloud."
Write-Host ""
Write-Host "1) Verifica tu SHA-1 debug (debe coincidir con el keystore de npm run android:dev):"
Write-Host ""

& "$PSScriptRoot\get-android-sha1.ps1"

Write-Host "2) En Firebase Console, abre tu app Android com.kawsaqeco.app"
Write-Host "   y agrega esta huella SHA-1 si no está:"
Write-Host ""
Write-Host "   $sha1Formatted" -ForegroundColor Cyan
Write-Host ""
Write-Host "3) Descarga el nuevo google-services.json y reemplaza mobile/google-services.json"
Write-Host ""
Write-Host "4) Recompila e instala la app nativa (NO uses Expo Go):"
Write-Host "   npm run android:dev" -ForegroundColor Yellow
Write-Host ""
Write-Host "5) Agrega tu Gmail en Google Cloud > Usuarios de prueba (modo Testing)"
Write-Host ""

$open = Read-Host "Abrir Firebase Console en el navegador? (S/n)"
if ($open -ne "n" -and $open -ne "N") {
  Start-Process $firebaseUrl
}

Write-Host "Listo. Cuando agregues el SHA-1, espera 2-5 min y recompila." -ForegroundColor Green
Write-Host ""
