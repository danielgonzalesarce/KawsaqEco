"""Puntos de acopio y reciclaje — distrito de Santa Anita, Lima."""

from typing import Any

DISTRITO_FOCO = "Santa Anita"

# Centro aproximado del distrito (Municipalidad)
SANTA_ANITA_CENTER = (-12.0439, -76.9714)

TIPOS_ESTANDAR = ["plástico", "papel", "vidrio", "metal", "orgánico"]
TIPOS_AMPLIOS = [*TIPOS_ESTANDAR, "electrónico"]

ACOPIO_SANTA_ANITA: list[dict[str, Any]] = [
    {
        "id": "mun-santa-anita",
        "nombre": "Municipalidad de Santa Anita — Centro de Reciclaje",
        "distrito": DISTRITO_FOCO,
        "direccion": "Av. Los Frutales 200",
        "tipos_residuo": TIPOS_AMPLIOS,
        "horario": "Lun–Vie 8:00–17:00, Sáb 8:00–13:00",
        "lat": -12.0439,
        "lng": -76.9714,
        "zona": "este",
        "tipo_entidad": "municipalidad",
    },
    {
        "id": "sa-punto-limpio-frutales",
        "nombre": "Punto Limpio Av. Los Frutales",
        "distrito": DISTRITO_FOCO,
        "direccion": "Av. Los Frutales cdra. 4 (frente al parque)",
        "tipos_residuo": TIPOS_ESTANDAR,
        "horario": "Lun–Dom 7:00–19:00",
        "lat": -12.0412,
        "lng": -76.9688,
        "zona": "este",
        "tipo_entidad": "punto_verde",
    },
    {
        "id": "sa-ecoparque-proceres",
        "nombre": "Ecoparque Santa Anita — Av. Próceres",
        "distrito": DISTRITO_FOCO,
        "direccion": "Av. Próceres de la Independencia cdra. 12",
        "tipos_residuo": TIPOS_ESTANDAR,
        "horario": "Mar–Sáb 9:00–16:00",
        "lat": -12.0385,
        "lng": -76.9620,
        "zona": "este",
        "tipo_entidad": "ecoparque",
    },
    {
        "id": "sa-reciclame-anexo",
        "nombre": "Aliado Recíclame Perú — Santa Anita",
        "distrito": DISTRITO_FOCO,
        "direccion": "Av. Nicolás Ayllón 3800 (zona industrial)",
        "tipos_residuo": TIPOS_AMPLIOS,
        "horario": "Lun–Vie 9:00–18:00",
        "lat": -12.0498,
        "lng": -76.9585,
        "zona": "este",
        "tipo_entidad": "aliado",
    },
    {
        "id": "sa-colegio-verde",
        "nombre": "Programa Escuela Verde — I.E. Santa Anita",
        "distrito": DISTRITO_FOCO,
        "direccion": "Jr. Las Camelias 450",
        "tipos_residuo": ["papel", "plástico", "vidrio"],
        "horario": "Lun–Vie 8:00–14:00 (comunidad los sábados)",
        "lat": -12.0475,
        "lng": -76.9755,
        "zona": "este",
        "tipo_entidad": "comunidad",
    },
]

TOTAL_PUNTOS_SANTA_ANITA = len(ACOPIO_SANTA_ANITA)
