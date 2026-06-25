"""Datos estáticos y utilidades de base de datos para el MVP — piloto Santa Anita."""

import math
from typing import Any

from database.acopio_santa_anita import ACOPIO_SANTA_ANITA

ACOPIO_POINTS: list[dict[str, Any]] = ACOPIO_SANTA_ANITA

REWARDS_CATALOG = [
    {
        "id": "r1",
        "nombre": "Descuento 15% bodega Los Frutales",
        "descripcion": "Válido en productos de limpieza ecológica del mercado de Santa Anita",
        "puntos_requeridos": 120,
        "tipo": "descuento",
        "partner": "Bodega Los Frutales",
        "valor_monetario": 8.0,
        "stock": 40,
    },
    {
        "id": "r2",
        "nombre": "Recarga Metropolitano S/3",
        "descripcion": "Recarga para la línea que pasa por Av. Próceres (Santa Anita)",
        "puntos_requeridos": 100,
        "tipo": "recarga",
        "partner": "ATU Lima",
        "valor_monetario": 3.0,
        "stock": 80,
    },
    {
        "id": "r3",
        "nombre": "Kit separación en casa",
        "descripcion": "Bolsas reutilizables entregadas en la Municipalidad de Santa Anita",
        "puntos_requeridos": 250,
        "tipo": "producto",
        "partner": "Municipalidad Santa Anita",
        "valor_monetario": 12.0,
        "stock": 25,
    },
    {
        "id": "r4",
        "nombre": "Insignia Guardián Anita",
        "descripcion": "Badge digital exclusivo de la comunidad KawsaqEco Santa Anita",
        "puntos_requeridos": 400,
        "tipo": "insignia",
        "partner": "KawsaqEco",
        "valor_monetario": 0,
        "stock": -1,
    },
    {
        "id": "r5",
        "nombre": "Entrada Ecoparque Próceres",
        "descripcion": "Visita guiada al ecoparque distrital (sábados)",
        "puntos_requeridos": 180,
        "tipo": "experiencia",
        "partner": "Ecoparque Santa Anita",
        "valor_monetario": 0,
        "stock": 15,
    },
    {
        "id": "r6",
        "nombre": "Sorteo planta nativa",
        "descripcion": "Participa en el sorteo mensual de la Escuela Verde",
        "puntos_requeridos": 80,
        "tipo": "sorteo",
        "partner": "Programa Escuela Verde",
        "valor_monetario": 0,
        "stock": 30,
    },
]

RANKING_COMUNIDAD = [
    {"nombre": "María G. · Los Frutales", "total_points": 2450, "posicion": 1},
    {"nombre": "Carlos R. · Próceres", "total_points": 1980, "posicion": 2},
    {"nombre": "Ana T. · Las Camelias", "total_points": 1720, "posicion": 3},
    {"nombre": "Luis P. · Zona industrial", "total_points": 1340, "posicion": 4},
    {"nombre": "Familia Quispe", "total_points": 980, "posicion": 5},
]

RANKING_DISTRITAL = RANKING_COMUNIDAD


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """Calcula distancia en metros entre dos coordenadas."""
    r = 6371000
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(dlambda / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def buscar_acopio_cercano(
    lat: float,
    lng: float,
    tipo: str | None = None,
    radio: int = 5000,
    limit: int = 3,
    todos: bool = False,
) -> list[dict]:
    """Busca puntos de acopio más cercanos. Municipalidades aceptan residuos estándar."""
    resultados = []
    for punto in ACOPIO_POINTS:
        dist = haversine(lat, lng, punto["lat"], punto["lng"])
        if not todos and dist > radio:
            continue
        if tipo and tipo not in punto["tipos_residuo"]:
            # Las municipalidades reciben residuos mixtos en ventanilla única
            if punto.get("tipo_entidad") != "municipalidad":
                continue
        resultados.append({**punto, "distancia_m": round(dist)})
    resultados.sort(key=lambda x: x["distancia_m"])
    if todos:
        return resultados[:limit]
    return resultados[:limit]

