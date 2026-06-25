# Arquitectura KawsaqEco

## Stack

| Capa | Tecnología |
|------|-----------|
| Mobile | React Native + Expo SDK 54, TypeScript, Expo Router |
| Backend | FastAPI + Uvicorn |
| IA | Claude API (claude-sonnet-4) — visión + chat |
| Cache | Redis (historial chat, TTL 24h) |
| DB | PostgreSQL 15 + Supabase |

## Flujo principal

```
Usuario escanea residuo
    → Mobile envía base64 a POST /api/scan
    → Claude Vision clasifica
    → Backend calcula impacto + busca acopio cercano (Haversine)
    → Mobile muestra resultado + puntos
    → Usuario confirma acopio → +20 pts
```

## Módulos

1. **Scan** — Visión IA con Claude, fallback demo sin API key
2. **Chat** — Agente Kawsaq con historial Redis
3. **Points** — Gamificación, niveles, ranking comunitario (Santa Anita)
4. **Acopio** — Búsqueda por proximidad en Santa Anita
5. **Rewards** — Catálogo y canje de recompensas

## Deploy

- **Mobile**: `eas build` → App Store / Google Play
- **Backend**: Railway o Render con variables de entorno
