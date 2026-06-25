# Imprime la huella SHA-1 del keystore debug (usada por npm run android:dev).
$ErrorActionPreference = "Stop"

$keytoolCandidates = @(
  "$env:JAVA_HOME\bin\keytool.exe",
  "${env:ProgramFiles}\Android\Android Studio\jbr\bin\keytool.exe",
  "${env:ProgramFiles(x86)}\Android\Android Studio\jbr\bin\keytool.exe"
)

$keytool = $keytoolCandidates | Where-Object { $_ -and (Test-Path $_) } | Select-Object -First 1
if (-not $keytool) {
  Write-Host "No se encontró keytool. Instala Android Studio o define JAVA_HOME." -ForegroundColor Red
  exit 1
}

$keystore = Join-Path $env:USERPROFILE ".android\debug.keystore"
if (-not (Test-Path $keystore)) {
  Write-Host "No existe $keystore — compila primero con: npm run android:dev" -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "=== SHA-1 debug (KawsaqEco) ===" -ForegroundColor Cyan
Write-Host "Paquete Android: com.kawsaqeco.app"
Write-Host ""

& $keytool -list -v -keystore $keystore -alias androiddebugkey -storepass android -keypass android |
  Select-String -Pattern "SHA1|SHA-1"

Write-Host ""
Write-Host "Pega el SHA-1 en Firebase:" -ForegroundColor Yellow
Write-Host "https://console.firebase.google.com/project/kawsaqeco/settings/general"
Write-Host ""
Write-Host "Proyecto > Configuracion > Tus apps > Android (com.kawsaqeco.app) > Agregar huella"
Write-Host ""
Write-Host "Luego vuelve a descargar google-services.json y ejecuta: npm run android:dev"
Write-Host ""
