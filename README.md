# KawsaqEco

**Recicla, actúa, da vida.** — App móvil de reciclaje inteligente con IA para **Santa Anita, Lima**.

En quechua, *Kawsaq* significa "el que da vida".

## Requisitos previos

| Herramienta | Versión recomendada |
|-------------|---------------------|
| [Node.js](https://nodejs.org/) | 18+ |
| [Python](https://www.python.org/) | 3.11+ |
| [Expo Go](https://expo.dev/go) | En tu celular (Android/iOS) |
| Git | Opcional |

> **Windows:** usa PowerShell o CMD. En celular físico, PC y móvil deben estar en la **misma red Wi‑Fi**.

---

## 1. Backend (FastAPI)

### Instalación (primera vez)

```powershell
cd backend

# Crear entorno virtual
python -m venv venv

# Activar entorno virtual
venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt
```

En macOS/Linux:

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Variables de entorno

Copia o crea `backend/.env`:

```env
# Escaneo y chat con Gemini (Google AI Studio) — una sola key
GEMINI_API_KEY=tu_clave_gemini

# Chat de respaldo (opcional)
# DEEPSEEK_API_KEY=tu_clave_deepseek

# Alternativa de pago
ANTHROPIC_API_KEY=sk-ant-...

# Firebase (opcional — sin esto usa memoria local)
FIREBASE_PROJECT_ID=kawsaqeco
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json

# Redis (opcional — historial de chat en memoria si no hay Redis)
REDIS_URL=redis://localhost:6379

# Autenticación JWT (obligatorio en producción)
JWT_SECRET=cambia-este-secreto-en-produccion
JWT_EXPIRE_HOURS=168

# Entorno: development | production
APP_ENV=development

# Solo producción — orígenes CORS separados por coma
# CORS_ORIGINS=https://kawsaqeco.app
```

> **Modo demo:** si no configuras API keys, el backend funciona igual con datos simulados de Santa Anita (escaneo, chat, puntos, acopios).

### Ejecutar el servidor

**Desde la raíz del proyecto** (`kawsaqeco\`):

```powershell
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000 --host 127.0.0.1
```

**Si ya estás dentro de `backend\`** (como en tu terminal), **no** vuelvas a hacer `cd backend` — solo:

```powershell
venv\Scripts\activate
uvicorn main:app --reload --port 8000 --host 127.0.0.1
```

> El error `backend\backend no existe` aparece cuando ejecutas `cd backend` estando ya en la carpeta `backend`. En ese caso omite el `cd`.

| URL | Descripción |
|-----|-------------|
| http://localhost:8000/ | Health check |
| http://localhost:8000/docs | Swagger (probar endpoints) |

Debes ver algo como:

```json
{
  "status": "ok",
  "app": "KawsaqEco",
  "ai": { "scan": "demo", "chat": "demo" }
}
```

Con `GEMINI_API_KEY` configurada, escaneo y chat usan `gemini-2.5-flash`.

---

## 2. Mobile (Expo / React Native)

### Instalación (primera vez)

```powershell
cd mobile
npm install
```

### Variables de entorno (USB)

En `mobile/.env`:

```env
EXPO_PUBLIC_API_URL=http://127.0.0.1:8000
```

Con **adb reverse**, el celular accede al backend de tu PC por `127.0.0.1`.

### Ejecutar con cable USB (recomendado)

1. Conecta el Samsung por **USB**.
2. Activa **Depuración USB** en el celular.
3. Un solo comando (backend + Metro + túnel):

```powershell
cd mobile
npm run start:all
```

O por separado:

**Terminal 1 — Backend**
```powershell
cd backend
.\venv\Scripts\activate
uvicorn main:app --reload --port 8000 --host 127.0.0.1
```

**Terminal 2 — Mobile + túnel**
```powershell
cd mobile
npm run start:usb
```

4. Abre la app **KawsaqEco** en el celular (o presiona `a` si detecta tu dispositivo).

En consola verás:
```
[KawsaqEco] API (USB) → http://127.0.0.1:8000
```

| Comando | Uso |
|---------|-----|
| `npm run start:all` | Backend + Metro + adb reverse |
| `npm run start:usb` | Solo Metro + adb reverse |
| `npm run android:dev` | Compilar e instalar APK nativo |

---

## 3. Orden de arranque recomendado

Abre **dos terminales** en PowerShell:

**Terminal 1 — Backend**

```powershell
cd C:\hackathon-TECSUP\kawsaqeco\backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000 --host 127.0.0.1
```

Debes ver:

```
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Application startup complete.
```

**Terminal 2 — Mobile**

```powershell
cd C:\hackathon-TECSUP\kawsaqeco\mobile
npm run android
```

O, si usas **Expo Go** en el celular:

```powershell
cd C:\hackathon-TECSUP\kawsaqeco\mobile
npx expo start --clear
```

---

## Estructura del proyecto

```
kawsaqeco/
├── backend/          # API FastAPI (scan, chat, acopio, retos…)
│   ├── main.py
│   ├── routers/
│   ├── services/
│   └── data/         # Acopios, normativa, puntos (JSON)
├── mobile/           # App Expo SDK 54 + React Native
│   ├── app/          # Pantallas (expo-router)
│   └── services/     # Cliente API, historial, perfil
└── docs/             # Documentación adicional
```

---

## Solución de problemas

| Problema | Solución |
|----------|----------|
| `backend\backend no existe` | Ya estás en `backend\`; no hagas `cd backend` otra vez |
| `Sin conexión al servidor` | Verifica que uvicorn esté corriendo y uses `--host 0.0.0.0` |
| La app no encuentra la API | USB conectado; ejecuta `npm run start:usb`; revisa `[KawsaqEco] API (USB) →` en Metro |
| Firewall bloquea | Permite Python/uvicorn en el puerto **8000** (Windows Defender) |
| Cambios no se ven | Cierra Expo Go y vuelve a escanear el QR; usa `--clear` |
| `pip` no reconocido | Usa `python -m pip install -r requirements.txt` |
| Permiso de cámara/GPS | Acepta permisos en el celular al abrir Escaneo o Mapa |

---

## Seguridad y autenticación

- Los endpoints de escaneo, chat, puntos, canjes y home **requieren JWT** (`Authorization: Bearer <token>`).
- Registro e inicio de sesión: `POST /api/auth/register`, `/login`, `/login-phone`, `/google`.
- El saldo de puntos vive en el **backend**; la app móvil lo consulta vía `/api/points/me`.
- Tokens en mobile guardados con **expo-secure-store**.
- En producción: define `JWT_SECRET`, `APP_ENV=production` y `CORS_ORIGINS`.

**Despliegue en la nube:** ver [docs/deploy.md](docs/deploy.md) (Render + EAS Build).

---

## Módulos principales

| Módulo | Descripción |
|--------|-------------|
| Scan IA | Clasificación de residuos (Gemini / Claude / demo) |
| Chat Kawsaq | Agente educativo con contexto de Santa Anita |
| Gamificación | Puntos, niveles, retos semanales, ranking |
| Acopio | Puntos de acopio en Santa Anita + mapa GPS |
| Normativa | Leyes peruanas de reciclaje por tipo |
| Impacto | CO₂, agua, proyección anual |
| Recompensas | Catálogo y canje de puntos |

---

## Licencia

Proyecto desarrollado para hackathon TECSUP — Lima, Perú.
