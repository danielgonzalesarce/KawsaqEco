"""Router POST /api/scan — clasificación de residuos con visión IA."""

import os

from fastapi import APIRouter, Depends, HTTPException

from models.schemas import ScanRequest, ScanResponse
from services.auth_deps import get_current_user_id
from services.claude_service import analyze_waste_image
from services.challenges_service import check_and_award_challenges
from services.impact_service import calcular_impacto
from services.points_service import registrar_puntos
from services.regulaciones_service import get_regulacion
from database.connection import buscar_acopio_cercano

router = APIRouter(prefix="/api", tags=["scan"])


@router.post("/scan", response_model=ScanResponse)
async def scan_residue(body: ScanRequest, user_id: str = Depends(get_current_user_id)):
    """Clasifica residuo desde imagen base64 y otorga puntos."""
    try:
        resultado = await analyze_waste_image(body.image_base64)
        tipo = resultado.get("tipo", "no_identificado")
        puntos = resultado.get("puntos", 5)

        if tipo not in ("no_identificado", "no_es_residuo"):
            registrar_puntos(user_id, "SCAN_RESIDUO", puntos, {"tipo": tipo})
            check_and_award_challenges(user_id)

        confianza = float(resultado.get("confianza", 0.5))
        acopio = None
        if body.lat and body.lng:
            cercanos = buscar_acopio_cercano(body.lat, body.lng, tipo, radio=50000, limit=1)
            acopio = cercanos[0] if cercanos else None

        impacto = calcular_impacto(tipo) if tipo not in ("no_identificado", "no_es_residuo") else None
        regulacion = get_regulacion(tipo) if tipo not in ("no_identificado", "no_es_residuo") else None
        modo_ia = "gemini" if os.getenv("GEMINI_API_KEY") else "claude" if os.getenv("ANTHROPIC_API_KEY", "").startswith("sk-ant") else "demo"

        return ScanResponse(
            tipo=tipo,
            confianza=confianza,
            nombre_especifico=resultado.get("nombre_especifico") or "",
            instrucciones=resultado.get("instrucciones") or "",
            reciclable=bool(resultado.get("reciclable", False)),
            puntos=puntos,
            dato_impacto=resultado.get("dato_impacto") or "",
            acopio_cercano=acopio,
            impacto=impacto,
            regulacion=regulacion,
            modo_ia=modo_ia,
            sugerir_retake=confianza < 0.6,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error al analizar la imagen") from e
