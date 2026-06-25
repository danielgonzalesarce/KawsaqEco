"""Router GET /api/acopio — puntos de acopio en Santa Anita."""

from fastapi import APIRouter, Query

from database.acopio_santa_anita import DISTRITO_FOCO, TOTAL_PUNTOS_SANTA_ANITA
from database.connection import buscar_acopio_cercano
from models.schemas import AcopioPoint

router = APIRouter(prefix="/api", tags=["acopio"])


@router.get("/acopio", response_model=list[AcopioPoint])
async def search_acopio(
    lat: float = Query(..., description="Latitud del usuario"),
    lng: float = Query(..., description="Longitud del usuario"),
    tipo: str | None = Query(None, description="Tipo de residuo"),
    radio: int = Query(5000, description="Radio de búsqueda en metros (dentro de Santa Anita)"),
    limit: int = Query(20, description="Máximo de resultados"),
    todos: bool = Query(True, description="Listar todos los puntos de Santa Anita"),
):
    """Devuelve centros de acopio del distrito de Santa Anita."""
    resultados = buscar_acopio_cercano(lat, lng, tipo, radio, limit, todos=todos)
    return [AcopioPoint(**r) for r in resultados]


@router.get("/acopio/resumen")
async def acopio_resumen():
    """Resumen de cobertura de acopio en Santa Anita."""
    return {
        "distrito": DISTRITO_FOCO,
        "total_centros": TOTAL_PUNTOS_SANTA_ANITA,
        "mensaje": f"{TOTAL_PUNTOS_SANTA_ANITA} puntos de acopio en {DISTRITO_FOCO}",
    }
