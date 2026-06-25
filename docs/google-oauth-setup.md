# Google Sign-In — configuración

## Por qué falló auth.expo.io

El proxy `https://auth.expo.io/...` **ya no funciona** con Expo Go. Google Sign-In requiere un **development build** (app nativa compilada).

---

## Paso 1 — Cliente Web (ya lo tienes)

Google Cloud → **Clientes** → **Aplicación web**

URIs de redireccionamiento (solo https, **sin duplicados**):

```
https://kawsaqeco.firebaseapp.com/__/auth/handler
```

No agregues `kawsaqeco://` ni `auth.expo.io` aquí.

---

## Paso 2 — Crear cliente OAuth Android

Google Cloud → **Clientes** → **Crear cliente** → **Android**

| Campo | Valor |
|-------|-------|
| Nombre del paquete | `com.kawsaqeco.app` |
| Huella SHA-1 | ver abajo |

### Obtener SHA-1 (Windows)

```powershell
cd mobile
npm run google:sha1
```

Huella debug de este equipo (keystore `%USERPROFILE%\.android\debug.keystore`):

```
34:85:39:8D:1D:C7:47:E9:9B:1C:AB:04:F9:AD:D3:81:BF:DB:3F:90
```

**Importante:** agrega el SHA-1 en **Firebase Console** (no solo en Google Cloud):

1. [Firebase → Configuración del proyecto](https://console.firebase.google.com/project/kawsaqeco/settings/general)
2. App Android `com.kawsaqeco.app` → **Agregar huella**
3. Pega el SHA-1 → Guardar
4. Descarga **google-services.json** → reemplaza `mobile/google-services.json`
5. Recompila: `npm run android:dev`

Guía interactiva: `npm run google:setup`

Alternativa con keystore debug por defecto:

```powershell
keytool -list -v -keystore $env:USERPROFILE\.android\debug.keystore -alias androiddebugkey -storepass android -keypass android
```

---

## Paso 3 — Usuarios de prueba

Google Cloud → **Público** → **Usuarios de prueba** → agrega tu Gmail.

---

## Paso 4 — Firebase

Authentication → Método de acceso → **Google** habilitado.

---

## Paso 5 — Compilar y probar (NO uses Expo Go)

```powershell
cd mobile
npm run android:dev
```

Esto compila e instala la app nativa. **No abras Expo Go.**

1. Abre la app **KawsaqEco** instalada en el emulador/teléfono
2. Login → Google
3. Usa el Gmail de prueba

---

## Resumen

| Entorno | ¿Google funciona? |
|---------|-------------------|
| Expo Go (`npm run android`) | ❌ No |
| Development build (`npm run android:dev`) | ✅ Sí |
