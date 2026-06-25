"""Router GET/POST /api/points — gamificación y niveles."""

from fastapi import APIRouter, Depends, HTTPException

from models.schemas import (
    PointsActionRequest,
    PointsSummary,
    ImpactSummary,
    LeaderboardEntry,
    AcopioVerifyRequest,
    AcopioGeofenceStatus,
)
from services.auth_deps import assert_user_access, get_current_user, get_current_user_id
from services.geofence_service import check_acopio_geofence, geofence_error_message
from services.points_service import (
    registrar_puntos, obtener_total, obtener_nivel, historial_usuario,
)
from services.impact_service import calcular_impacto, arboles_equivalentes
from services.challenges_service import check_and_award_challenges
from services.claude_service import generate_personalization
from database.connection import RANKING_DISTRITAL

router = APIRouter(prefix="/api", tags=["points"])


def _points_summary(user_id: str) -> PointsSummary:
    total = obtener_total(user_id)
    nombre, emoji, proximo, faltantes = obtener_nivel(total)
    return PointsSummary(
        user_id=user_id,
        total_points=total,
        nivel=nombre,
        emoji=emoji,
        proximo_nivel=proximo,
        puntos_faltantes=faltantes,
    )


@router.get("/points/me", response_model=PointsSummary)
async def get_my_points(user_id: str = Depends(get_current_user_id)):
    """Resumen de puntos del usuario autenticado."""
    return _points_summary(user_id)


@router.get("/points/{user_id}", response_model=PointsSummary)
async def get_points(user_id: str, user: dict = Depends(get_current_user)):
    """Obtiene resumen de puntos y nivel del usuario."""
    assert_user_access(user_id, user)
    return _points_summary(user_id)


@router.post("/points")
async def add_points(body: PointsActionRequest, user: dict = Depends(get_current_user)):
    """Registra acción de puntos (escaneo, acopio verificado, etc.)."""
    assert_user_access(body.user_id, user)
    total = registrar_puntos(body.user_id, body.action, body.points, body.metadata)
    nombre, emoji, proximo, faltantes = obtener_nivel(total)
    return {
        "total_points": total,
        "nivel": nombre,
        "emoji": emoji,
        "proximo_nivel": proximo,
        "puntos_faltantes": faltantes,
    }


@router.get("/points/acopio-geofence", response_model=AcopioGeofenceStatus)
async def acopio_geofence_status(
    lat: float,
    lng: float,
    acopio_id: str | None = None,
    user_id: str = Depends(get_current_user_id),
):
    """Comprueba proximidad al acopio sin otorgar puntos."""
    _ = user_id
    return AcopioGeofenceStatus(**check_acopio_geofence(lat, lng, acopio_id))


@router.post("/points/acopio-verificado")
async def verify_acopio(body: AcopioVerifyRequest, user_id: str = Depends(get_current_user_id)):
    """Confirma entrega en acopio (+20 pts) si el GPS está dentro del radio permitido."""
    check = check_acopio_geofence(body.lat, body.lng, body.acopio_id)
    if not check["ok"]:
        raise HTTPException(status_code=400, detail=geofence_error_message(check))

    total = registrar_puntos(
        user_id,
        "ACOPIO_VERIFICADO",
        metadata={
            "acopio_id": check["acopio_id"],
            "acopio_nombre": check["acopio_nombre"],
            "distancia_m": check["distancia_m"],
            "lat": body.lat,
            "lng": body.lng,
        },
    )
    check_and_award_challenges(user_id)
    return {
        "total_points": total,
        "puntos_ganados": 20,
        "geofence": check,
    }


@router.get("/impact/me", response_model=ImpactSummary)
async def get_my_impact(user_id: str = Depends(get_current_user_id)):
    return await _build_impact(user_id)


@router.get("/impact/{user_id}", response_model=ImpactSummary)
async def get_impact(user_id: str, user: dict = Depends(get_current_user)):
    """Calcula impacto ambiental acumulado del usuario."""
    assert_user_access(user_id, user)
    return await _build_impact(user_id)


async def _build_impact(user_id: str) -> ImpactSummary:
    historial = historial_usuario(user_id)
    co2_total = 0.0
    agua_total = 0.0
    por_tipo: dict[str, int] = {}

    for entry in historial:
        if entry["action"] == "SCAN_RESIDUO":
            tipo = entry.get("metadata", {}).get("tipo", "plástico")
            impacto = calcular_impacto(tipo)
            co2_total += impacto["co2_evitado_kg"]
            agua_total += impacto["agua_ahorrada_lt"]
            por_tipo[tipo] = por_tipo.get(tipo, 0) + 1

    return ImpactSummary(
        co2_evitado_kg=round(co2_total, 2),
        agua_ahorrada_lt=round(agua_total, 1),
        arboles_equivalentes=arboles_equivalentes(co2_total),
        residuos_por_tipo=por_tipo,
        proyeccion_anual_co2=round(co2_total * 12, 2),
    )


@router.get("/personalization/me")
async def get_my_personalization(user_id: str = Depends(get_current_user_id)):
    return await _build_personalization(user_id)


@router.get("/personalization/{user_id}")
async def get_personalization(user_id: str, user: dict = Depends(get_current_user)):
    """Genera tips personalizados basados en historial."""
    assert_user_access(user_id, user)
    return await _build_personalization(user_id)


async def _build_personalization(user_id: str):
    historial = historial_usuario(user_id)
    historial_str = str(historial) if historial else "Sin historial aún"
    return await generate_personalization(historial_str)


@router.get("/ranking/comunidad", response_model=list[LeaderboardEntry])
@router.get("/ranking/distrital", response_model=list[LeaderboardEntry], include_in_schema=False)
async def ranking_comunidad():
    """Ranking vecinal del piloto Santa Anita."""
    return [LeaderboardEntry(**r) for r in RANKING_DISTRITAL]
