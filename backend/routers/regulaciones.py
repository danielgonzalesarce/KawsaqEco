"""Router GET /api/regulaciones — normativa local de reciclaje."""

from fastapi import APIRouter

from services.regulaciones_service import get_regulacion, list_regulaciones

router = APIRouter(prefix="/api", tags=["regulaciones"])


@router.get("/regulaciones")
async def all_regulaciones():
    return list_regulaciones()


@router.get("/regulaciones/{tipo}")
async def regulacion_por_tipo(tipo: str):
    return get_regulacion(tipo)
