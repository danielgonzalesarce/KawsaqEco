"""Verificación de proximidad GPS a puntos de acopio."""

import os

from database.connection import ACOPIO_POINTS, haversine

DEFAULT_RADIUS_M = int(os.getenv("ACOPIO_GEOFENCE_RADIUS_M", "150"))


def _find_acopio(acopio_id: str | None) -> dict | None:
    if not acopio_id:
        return None
    return next((p for p in ACOPIO_POINTS if p["id"] == acopio_id), None)


def check_acopio_geofence(
    lat: float,
    lng: float,
    acopio_id: str | None = None,
    radius_m: int | None = None,
) -> dict:
    """
    Comprueba si el usuario está dentro del radio de un acopio.

    Si acopio_id está definido, valida contra ese punto.
    Si no, usa el acopio más cercano del catálogo.
    """
    radio = radius_m if radius_m is not None else DEFAULT_RADIUS_M
    target = _find_acopio(acopio_id)

    if target:
        dist = haversine(lat, lng, target["lat"], target["lng"])
        return {
            "ok": dist <= radio,
            "distancia_m": round(dist),
            "radio_max_m": radio,
            "acopio_id": target["id"],
            "acopio_nombre": target["nombre"],
        }

    if not ACOPIO_POINTS:
        return {
            "ok": False,
            "distancia_m": 0,
            "radio_max_m": radio,
            "acopio_id": None,
            "acopio_nombre": None,
        }

    nearest = min(
        ACOPIO_POINTS,
        key=lambda p: haversine(lat, lng, p["lat"], p["lng"]),
    )
    dist = haversine(lat, lng, nearest["lat"], nearest["lng"])
    return {
        "ok": dist <= radio,
        "distancia_m": round(dist),
        "radio_max_m": radio,
        "acopio_id": nearest["id"],
        "acopio_nombre": nearest["nombre"],
    }


def geofence_error_message(check: dict) -> str:
    nombre = check.get("acopio_nombre") or "el punto de acopio"
    dist = check.get("distancia_m", 0)
    radio = check.get("radio_max_m", DEFAULT_RADIUS_M)
    return (
        f"Debes estar a menos de {radio} m de {nombre}. "
        f"Tu ubicación está a {dist} m."
    )
