"""Retos semanales de gamificación."""

from datetime import datetime, timezone

from services.points_service import historial_usuario, registrar_puntos

CHALLENGES: list[dict] = [
    {
        "id": "escaneos_5",
        "nombre": "Reciclador de la semana",
        "descripcion": "Escanea 5 residuos esta semana",
        "meta": 5,
        "puntos_recompensa": 50,
        "tipo": "escaneos",
        "icono": "scan",
    },
    {
        "id": "acopio_3",
        "nombre": "Guía verde",
        "descripcion": "Confirma 3 entregas al acopio",
        "meta": 3,
        "puntos_recompensa": 60,
        "tipo": "acopio",
        "icono": "navigate",
    },
    {
        "id": "tipos_3",
        "nombre": "Separador experto",
        "descripcion": "Recicla 3 tipos distintos de residuo",
        "meta": 3,
        "puntos_recompensa": 40,
        "tipo": "variedad",
        "icono": "layers",
    },
]


def _count_scans(user_id: str) -> int:
    return sum(1 for e in historial_usuario(user_id) if e.get("action") == "SCAN_RESIDUO")


def _count_acopio(user_id: str) -> int:
    return sum(1 for e in historial_usuario(user_id) if e.get("action") == "ACOPIO_VERIFICADO")


def _count_tipos(user_id: str) -> int:
    tipos = {
        e.get("metadata", {}).get("tipo")
        for e in historial_usuario(user_id)
        if e.get("action") == "SCAN_RESIDUO" and e.get("metadata", {}).get("tipo")
    }
    return len(tipos)


def _progress(user_id: str, challenge: dict) -> int:
    t = challenge["tipo"]
    if t == "escaneos":
        return _count_scans(user_id)
    if t == "acopio":
        return _count_acopio(user_id)
    if t == "variedad":
        return _count_tipos(user_id)
    return 0


def get_challenges_for_user(user_id: str) -> list[dict]:
    """Retos activos con progreso del usuario."""
    result = []
    for c in CHALLENGES:
        prog = _progress(user_id, c)
        meta = c["meta"]
        result.append({
            **c,
            "progreso": min(prog, meta),
            "completado": prog >= meta,
            "porcentaje": min(100, int(prog / meta * 100)) if meta else 0,
        })
    return result


def check_and_award_challenges(user_id: str) -> list[str]:
    """Otorga puntos si el usuario completó un reto (idempotente por sesión en memoria)."""
    awarded: list[str] = []
    for c in get_challenges_for_user(user_id):
        if c["completado"]:
            key = f"CHALLENGE_{c['id']}"
            hist = historial_usuario(user_id)
            if not any(e.get("action") == key for e in hist):
                registrar_puntos(user_id, key, c["puntos_recompensa"], {"reto": c["id"]})
                awarded.append(c["nombre"])
    return awarded
