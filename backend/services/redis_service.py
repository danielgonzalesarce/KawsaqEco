"""Servicio Redis con fallback en memoria para sesiones de chat."""

import json
import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()

TTL_SECONDS = int(timedelta(hours=24).total_seconds())
_memory_store: dict[str, str] = {}
_redis_client = None


def _get_redis():
    """Obtiene cliente Redis o None si no está disponible."""
    global _redis_client
    if _redis_client is not None:
        return _redis_client
    redis_url = os.getenv("REDIS_URL", "")
    if not redis_url or redis_url.startswith("redis://localhost") and not _ping_redis(redis_url):
        return None
    try:
        import redis
        _redis_client = redis.from_url(
            redis_url,
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        _redis_client.ping()
        return _redis_client
    except Exception:
        return None


def _ping_redis(url: str) -> bool:
    """Verifica si Redis responde (timeout corto para no bloquear)."""
    try:
        import redis
        r = redis.from_url(
            url,
            decode_responses=True,
            socket_connect_timeout=1,
            socket_timeout=1,
        )
        r.ping()
        return True
    except Exception:
        return False


def save_chat_history(user_id: str, history: list) -> None:
    """Guarda historial de chat con TTL 24h."""
    key = f"chat:{user_id}"
    data = json.dumps(history)
    client = _get_redis()
    if client:
        client.setex(key, TTL_SECONDS, data)
    else:
        _memory_store[key] = data


def get_chat_history(user_id: str) -> list:
    """Recupera historial de chat del usuario."""
    key = f"chat:{user_id}"
    client = _get_redis()
    data = client.get(key) if client else _memory_store.get(key)
    if not data:
        return []
    return json.loads(data)
