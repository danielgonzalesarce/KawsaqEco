"""Punto de entrada FastAPI — KawsaqEco API."""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import scan, chat, points, acopio, rewards, home, regulaciones, challenges, auth

app = FastAPI(
    title="KawsaqEco API",
    version="1.2.0",
    description="API de reciclaje inteligente con IA — piloto Santa Anita, Lima",
)

_app_env = os.getenv("APP_ENV", "development")
_cors_origins = os.getenv("CORS_ORIGINS", "")
if _app_env == "development":
    _origins = ["*"]
    _allow_credentials = False
else:
    _origins = [o.strip() for o in _cors_origins.split(",") if o.strip()] or ["https://kawsaqeco.app"]
    _allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=_allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(scan.router)
app.include_router(chat.router)
app.include_router(points.router)
app.include_router(acopio.router)
app.include_router(rewards.router)
app.include_router(home.router)
app.include_router(regulaciones.router)
app.include_router(challenges.router)
app.include_router(auth.router)


@app.get("/")
def health():
    """Health check del servidor."""
    import os
    return {
        "status": "ok",
        "app": "KawsaqEco",
        "tagline": "Recicla, actúa, da vida.",
        "ai": {
            "scan": "gemini-2.5-flash" if os.getenv("GEMINI_API_KEY") else "demo",
            "chat": "gemini-2.5-flash" if os.getenv("GEMINI_API_KEY") else (
                "deepseek" if os.getenv("DEEPSEEK_API_KEY") else "demo"
            ),
            "database": "firebase" if os.getenv("FIREBASE_PROJECT_ID") else "memory",
        },
    }
