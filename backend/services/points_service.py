"""Lógica de gamificación: puntos, niveles y retos."""

import json
from datetime import datetime, timezone
from pathlib import Path

from services.firebase_service import (
    DEMO_USER_ID,
    ensure_demo_user,
    get_user_total_points,
    insert_eco_points,
)

NIVELES: list[tuple[int, str, str]] = [
    (0, "Semilla", "🌱"),
    (200, "Brote", "🌿"),
    (500, "Árbol", "🌳"),
    (1000, "Guardián", "🦅"),
    (2500, "Héroe Kawsaq", "⭐"),
]

PUNTOS_POR_ACCION: dict[str, int] = {
    "SCAN_RESIDUO": 5,
    "ACOPIO_VERIFICADO": 20,
    "RACHA_7_DIAS": 50,
    "REFERIR_AMIGO": 100,
}

POINTS_FILE = Path(__file__).resolve().parents[1] / "data" / "points_cache.json"
_user_points: dict[str, list[dict]] = {}


def _load_points_cache() -> None:
    global _user_points
    if not POINTS_FILE.exists():
        return
    try:
        with open(POINTS_FILE, encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            _user_points = data
    except Exception:
        pass


def _save_points_cache() -> None:
    try:
        POINTS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(POINTS_FILE, "w", encoding="utf-8") as f:
            json.dump(_user_points, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


_load_points_cache()


def resolve_user_id(user_id: str) -> str:
    """Normaliza ID de usuario para Firebase."""
    return user_id or DEMO_USER_ID


def _memory_total(user_id: str) -> int:
    return sum(e["points"] for e in _user_points.get(resolve_user_id(user_id), []))


def registrar_puntos(user_id: str, action: str, points: int | None = None, metadata: dict | None = None) -> int:
    """Registra puntos y devuelve el total acumulado."""
    uid = resolve_user_id(user_id)
    pts = points if points is not None else PUNTOS_POR_ACCION.get(action, 5)
    entry = {
        "action": action,
        "points": pts,
        "metadata": metadata or {},
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _user_points.setdefault(uid, []).append(entry)
    _save_points_cache()

    ensure_demo_user(uid)
    insert_eco_points(uid, action, pts, metadata)

    return obtener_total(uid)


def obtener_total(user_id: str) -> int:
    """Devuelve el total de puntos del usuario."""
    uid = resolve_user_id(user_id)
    memory_total = _memory_total(uid)
    db_total = get_user_total_points(uid)
    if db_total is not None:
        return max(db_total, memory_total)
    return memory_total


def obtener_nivel(total: int) -> tuple[str, str, str | None, int]:
    """Devuelve (nombre, emoji, próximo_nivel, puntos_faltantes)."""
    nivel_actual = NIVELES[0]
    for i, (min_pts, nombre, emoji) in enumerate(NIVELES):
        if total >= min_pts:
            nivel_actual = (min_pts, nombre, emoji)
        if i + 1 < len(NIVELES) and total < NIVELES[i + 1][0]:
            faltan = NIVELES[i + 1][0] - total
            return nivel_actual[1], nivel_actual[2], NIVELES[i + 1][1], faltan
    return nivel_actual[1], nivel_actual[2], None, 0


def historial_usuario(user_id: str) -> list[dict]:
    """Historial de acciones de puntos."""
    return _user_points.get(resolve_user_id(user_id), [])
