# Configuración Firebase — KawsaqEco

## Paso 1 — Crear proyecto (desde tu pantalla de Firebase)

1. Clic en **Crear un proyecto de Firebase nuevo**
2. Nombre: `kawsaqeco`
3. Desactiva Google Analytics (opcional, más rápido)
4. **Crear proyecto**

> También puedes usar **TecsupApp** si prefieres no crear uno nuevo.

---

## Paso 2 — Activar Firestore

1. Menú izquierdo → **Build** → **Firestore Database**
2. **Create database**
3. Modo: **Start in test mode** (para hackathon)
4. Región: `southamerica-east1` o la más cercana
5. **Enable**

---

## Paso 3 — Descargar credenciales para el backend

1. ⚙️ **Project Settings** (engranaje arriba izquierda)
2. Pestaña **Service accounts**
3. **Generate new private key** → descarga el JSON
4. Renómbralo y muévelo a:
   ```
   C:\hackathon-TECSUP\kawsaqeco\backend\firebase-credentials.json
   ```

⚠️ **Nunca subas este archivo a GitHub** (ya está en `.gitignore`).

---

## Paso 4 — Configurar `backend/.env`

```env
FIREBASE_PROJECT_ID=kawsaqeco-xxxxx
FIREBASE_CREDENTIALS_PATH=./firebase-credentials.json

# Auth REST (Firebase Console → Project Settings → General → Web API Key)
FIREBASE_WEB_API_KEY=tu_web_api_key

# Google Sign-In (Authentication → Google → Web client ID)
GOOGLE_WEB_CLIENT_ID=tu_client_id.apps.googleusercontent.com
```

### Redirect URIs (Google Cloud Console → OAuth → Web client)

Agrega estas URIs autorizadas para Expo / Android:

- `kawsaqeco://`
- `exp://127.0.0.1:8081` (emulador)
- `exp://TU_IP:8081` (dispositivo físico, la IP que muestra Metro)

En **Firebase Console → Authentication → Sign-in method → Google** debe estar **habilitado**.

`FIREBASE_PROJECT_ID` = el **Project ID** que ves en Project Settings → General.

> La app móvil **no necesita** credenciales Firebase. Solo llama al backend; el backend usa `firebase-credentials.json`.

---

## Paso 5 — Reiniciar backend

```powershell
cd C:\hackathon-TECSUP\kawsaqeco\backend
venv\Scripts\activate
pip install firebase-admin
uvicorn main:app --reload --port 8000
```

---

## Paso 6 — Probar

1. Escanea un residuo en la app
2. Firebase Console → **Firestore** → colección `eco_points`
3. Deberías ver un documento con `user_id: demo-user`, `points: 5`

---

## Colecciones Firestore

| Colección | Contenido |
|-----------|-----------|
| `users` | Perfiles de usuario |
| `eco_points` | Historial de puntos por acción |

---

## Reglas Firestore (producción)

Para hackathon, test mode basta. Después cambia a:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if false;  // solo backend con service account
    }
  }
}
```

El backend usa **firebase-admin** con service account — no necesita reglas abiertas en mobile.
