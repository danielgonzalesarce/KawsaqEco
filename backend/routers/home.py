"""Router GET /api/home — resumen consolidado para pantalla principal (Santa Anita)."""

import os

from fastapi import APIRouter, Depends

from database.acopio_santa_anita import DISTRITO_FOCO, TOTAL_PUNTOS_SANTA_ANITA
from database.connection import RANKING_DISTRITAL
from models.schemas import ChallengeItem, HomeSummary, LeaderboardEntry
from services.auth_deps import assert_user_access, get_current_user, get_current_user_id
from services.challenges_service import get_challenges_for_user
from services.claude_service import generate_personalization
from services.impact_service import calcular_impacto, arboles_equivalentes
from services.points_service import historial_usuario, obtener_nivel, obtener_total, _user_points

router = APIRouter(prefix="/api", tags=["home"])


def _tip_desde_historial(historial: list) -> str:
    if not historial:
        return "Escanea tu primer residuo y gana puntos canjeables en Santa Anita."
    tipos = [
        e.get("metadata", {}).get("tipo")
        for e in historial
        if e.get("action") == "SCAN_RESIDUO" and e.get("metadata", {}).get("tipo")
    ]
    if tipos:
        frecuente = max(set(tipos), key=tipos.count)
        return f"Reciclas mucho {frecuente} — llévalo al Punto Limpio Los Frutales y gana +20 pts."
    return "Confirma cuando lleves residuos al acopio de Santa Anita para duplicar tu impacto."


def _residuo_frecuente(historial: list) -> str:
    tipos = [
        e.get("metadata", {}).get("tipo")
        for e in historial
        if e.get("action") == "SCAN_RESIDUO" and e.get("metadata", {}).get("tipo")
    ]
    return max(set(tipos), key=tipos.count) if tipos else ""


def _racha_dias(historial: list) -> int:
    from datetime import date, timedelta

    dias = set()
    for e in historial:
        if e.get("action") != "SCAN_RESIDUO":
            continue
        ts = e.get("created_at", "")[:10]
        if ts:
            try:
                dias.add(date.fromisoformat(ts))
            except ValueError:
                pass
    if not dias:
        return 0
    racha = 0
    hoy = date.today()
    d = hoy
    while d in dias:
        racha += 1
        d -= timedelta(days=1)
    return racha


async def _build_home(user_id: str) -> HomeSummary:
    total = obtener_total(user_id)
    nombre, emoji, _, _ = obtener_nivel(total)
    historial = historial_usuario(user_id)

    co2_total = 0.0
    agua_total = 0.0
    por_tipo: dict[str, int] = {}
    for entry in historial:
        if entry.get("action") == "SCAN_RESIDUO":
            tipo = entry.get("metadata", {}).get("tipo", "plástico")
            impacto = calcular_impacto(tipo)
            co2_total += impacto["co2_evitado_kg"]
            agua_total += impacto["agua_ahorrada_lt"]
            por_tipo[tipo] = por_tipo.get(tipo, 0) + 1

    pers = await generate_personalization(str(historial) if historial else "Sin historial")
    retos = get_challenges_for_user(user_id)

    modo_ia = "gemini" if os.getenv("GEMINI_API_KEY") else "demo"
    usuarios = max(len(_user_points), 1) + 47

    return HomeSummary(
        puntos=total,
        nivel=nombre,
        emoji=emoji,
        co2_evitado_kg=round(co2_total, 2),
        agua_ahorrada_lt=round(agua_total, 1),
        arboles_equivalentes=arboles_equivalentes(co2_total),
        distrito_foco=DISTRITO_FOCO,
        puntos_acopio=TOTAL_PUNTOS_SANTA_ANITA,
        tip_personalizado=pers.get("tip_personalizado") or _tip_desde_historial(historial),
        escaneos_total=sum(por_tipo.values()),
        ranking_top=[LeaderboardEntry(**r) for r in RANKING_DISTRITAL[:3]],
        residuo_frecuente=pers.get("residuo_frecuente") or _residuo_frecuente(historial),
        reto_sugerido=pers.get("reto_sugerido") or (retos[0]["nombre"] if retos else ""),
        proyeccion_anual_co2=round(co2_total * 12, 2),
        retos=[ChallengeItem(**c) for c in retos],
        usuarios_comunidad=usuarios,
        racha_dias=_racha_dias(historial),
        modo_ia_scan=modo_ia,
    )


@router.get("/home", response_model=HomeSummary)
async def get_home(user_id: str = Depends(get_current_user_id)):
    """Resumen de puntos, impacto, retos y comunidad Santa Anita."""
    return await _build_home(user_id)


@router.get("/home/{user_id}", response_model=HomeSummary, include_in_schema=False)
async def get_home_legacy(user_id: str, user: dict = Depends(get_current_user)):
    assert_user_access(user_id, user)
    return await _build_home(user_id)
