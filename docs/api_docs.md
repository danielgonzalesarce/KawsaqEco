# API KawsaqEco

Base URL: `http://localhost:8000`

## Endpoints

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/` | Health check |
| POST | `/api/scan` | Clasificar residuo (base64) |
| POST | `/api/chat` | Chat con Kawsaq |
| POST | `/api/chat/stream` | Chat SSE streaming |
| GET | `/api/points/me` | Puntos y nivel (JWT) |
| POST | `/api/points/acopio-verificado` | +20 pts acopio (body: `lat`, `lng`, `acopio_id?`) |
| GET | `/api/points/acopio-geofence` | Comprobar proximidad GPS sin otorgar puntos |
| GET | `/api/impact/{user_id}` | Impacto ambiental |
| GET | `/api/personalization/{user_id}` | Tips personalizados |
| GET | `/api/ranking/comunidad` | Ranking vecinal Santa Anita |
| GET | `/api/acopio?lat=&lng=&tipo=&radio=` | Puntos de acopio en Santa Anita |
| GET | `/api/rewards` | Catálogo recompensas |
| POST | `/api/rewards/redeem` | Canjear recompensa |

## Ejemplo scan

```json
POST /api/scan
{
  "image_base64": "data:image/jpeg;base64,...",
  "user_id": "demo-user",
  "lat": -12.0439,
  "lng": -76.9714
}
```

## Niveles

| Puntos | Nivel |
|--------|-------|
| 0–199 | Semilla 🌱 |
| 200–499 | Brote 🌿 |
| 500–999 | Árbol 🌳 |
| 1000–2499 | Guardián 🦅 |
| 2500+ | Héroe Kawsaq ⭐ |
