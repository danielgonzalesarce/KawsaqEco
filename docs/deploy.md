# Despliegue — KawsaqEco

Guía para publicar el **backend** en la nube y generar un **APK** con EAS Build.

---

## 1. Backend en Render (recomendado, plan free)

### Opción A — Blueprint automático

1. Sube el repo a GitHub.
2. Entra a [render.com](https://render.com) → **New** → **Blueprint**.
3. Conecta el repositorio; Render detectará `render.yaml`.
4. En el panel del servicio, configura las variables **sync: false**:
   - `GEMINI_API_KEY` — tu clave de Google AI Studio
   - `FIREBASE_PROJECT_ID`, `FIREBASE_WEB_API_KEY` (si usas Firebase Auth)
   - `FIREBASE_CREDENTIALS_JSON` — contenido completo de `firebase-credentials.json` en una línea
5. Deploy. La URL será algo como `https://kawsaqeco-api.onrender.com`.

### Opción B — Docker manual

```bash
cd backend
docker build -t kawsaqeco-api .
docker run -p 8000:8000 \
  -e JWT_SECRET=tu-secreto \
  -e APP_ENV=production \
  -e GEMINI_API_KEY=tu-key \
  kawsaqeco-api
```

### Disco persistente (plan de pago)

En el **plan free** de Render no hay disco persistente: usuarios/puntos en JSON se **reinician** al redeploy o tras inactividad prolongada. Para producción estable configura **Firebase** (`FIREBASE_CREDENTIALS_JSON`) o sube a plan Starter con disco en `render.yaml`.

### Verificar

```bash
curl https://TU-URL.onrender.com/
# {"status":"ok","app":"KawsaqEco",...}
```

---

## 2. App móvil — EAS Build

### Requisitos

```bash
npm install -g eas-cli
eas login
```

### Configurar URL del API en la nube

```bash
cd mobile

# Sustituye por tu URL de Render
eas secret:create --scope project --name EXPO_PUBLIC_API_URL --value https://kawsaqeco-api.onrender.com
```

O en `mobile/.env` para pruebas locales contra producción:

```env
EXPO_PUBLIC_API_URL=https://kawsaqeco-api.onrender.com
```

### Generar APK (preview / prueba)

```bash
cd mobile
eas build --platform android --profile preview
```

Cuando termine, descarga el APK desde el enlace de Expo.

### Build de producción (Play Store)

```bash
eas build --platform android --profile production
```

---

## 3. Variables de entorno — resumen

| Variable | Backend | Mobile |
|----------|---------|--------|
| `JWT_SECRET` | Obligatorio en prod | — |
| `APP_ENV=production` | Sí | — |
| `CORS_ORIGINS` | Dominios permitidos | — |
| `GEMINI_API_KEY` | Escaneo/chat IA | — |
| `EXPO_PUBLIC_API_URL` | — | URL HTTPS del API |

---

## 4. Checklist post-deploy

- [ ] `GET /` responde `status: ok`
- [ ] Registro/login devuelve JWT
- [ ] Escaneo funciona con usuario autenticado
- [ ] Saldo en Inicio = saldo en Canjear
- [ ] APK instalado apunta a la URL HTTPS (no `127.0.0.1`)

---

## 5. Alternativas a Render

| Plataforma | Notas |
|------------|--------|
| **Railway** | `railway up` desde `backend/` con el mismo Dockerfile |
| **Fly.io** | `fly launch` + volumen en `/app/data` |
| **Google Cloud Run** | Escala a cero; requiere volumen externo para JSON |

El `Dockerfile` en `backend/` es compatible con todas.

---

## 6. Android — tráfico HTTPS

En producción la app usa `EXPO_PUBLIC_API_URL` con **HTTPS**. El flag `usesCleartextTraffic` en `app.json` solo afecta HTTP local en desarrollo USB.
