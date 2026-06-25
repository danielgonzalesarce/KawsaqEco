# Configurar Supabase — KawsaqEco

> **Nota (2025):** El proyecto usa **Firebase + JSON local** como persistencia activa. Este documento se mantiene como referencia histórica; Supabase no está conectado al código actual.

## Paso 1 — Crear proyecto (desde tu pantalla actual)

1. Entra a **Mi Organización** (o crea una con **+ New organization**)
2. Clic en **New project**
3. Configura:
   - **Name:** `kawsaqeco`
   - **Database password:** elige una segura (guárdala)
   - **Region:** la más cercana (ej. South America o US East)
4. Clic **Create new project** → espera ~2 minutos

---

## Paso 2 — Obtener las API keys

1. En el proyecto → menú izquierdo **Project Settings** (⚙️)
2. Clic **API**
3. Copia estos 3 valores:

| Campo en Supabase | Variable en `.env` |
|-------------------|-------------------|
| Project URL | `SUPABASE_URL` / `EXPO_PUBLIC_SUPABASE_URL` |
| anon public | `EXPO_PUBLIC_SUPABASE_ANON_KEY` (mobile) |
| service_role | `SUPABASE_SERVICE_KEY` (backend, **secreta**) |

---

## Paso 3 — Crear las tablas (SQL Editor)

1. Menú izquierdo → **SQL Editor**
2. Clic **New query**
3. Copia y pega todo el contenido de:
   `backend/database/schema.sql`
4. Clic **Run**

Deberías ver: Success. No rows returned.

---

## Paso 4 — Configurar `.env`

### `backend/.env`
```env
SUPABASE_URL=https://TU_PROYECTO.supabase.co
SUPABASE_SERVICE_KEY=eyJ...tu_service_role_key...
```

### `mobile/.env`
```env
EXPO_PUBLIC_SUPABASE_URL=https://TU_PROYECTO.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...tu_anon_key...
```

---

## Paso 5 — Reiniciar servicios

```powershell
# Backend
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000

# Mobile (otra terminal)
cd mobile
npx expo start --clear
```

---

## Verificar que funciona

1. Escanea un residuo en la app → gana 5 pts
2. En Supabase → **Table Editor** → tabla `eco_points` → deberías ver el registro
3. Tabla `users` → usuario demo `Usuario Demo KawsaqEco`

---

## ⚠️ Seguridad

- **Nunca** pongas `service_role` en el mobile (solo en backend)
- No subas `.env` a GitHub
