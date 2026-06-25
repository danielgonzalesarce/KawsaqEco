"""Cálculo de impacto ambiental por tipo de residuo."""

IMPACTO_POR_KG: dict[str, dict[str, float]] = {
    "plástico": {"co2_evitado_kg": 1.5, "agua_ahorrada_lt": 17},
    "papel": {"co2_evitado_kg": 0.9, "agua_ahorrada_lt": 10},
    "vidrio": {"co2_evitado_kg": 0.3, "agua_ahorrada_lt": 3},
    "metal": {"co2_evitado_kg": 4.0, "agua_ahorrada_lt": 40},
    "orgánico": {"co2_evitado_kg": 0.5, "agua_ahorrada_lt": 0},
    "electrónico": {"co2_evitado_kg": 20.0, "agua_ahorrada_lt": 0},
}

PESO_PROMEDIO_ESCANEO: dict[str, float] = {
    "plástico": 0.05,
    "papel": 0.2,
    "vidrio": 0.3,
    "metal": 0.1,
    "orgánico": 0.15,
    "electrónico": 0.5,
}


def calcular_impacto(tipo: str, cantidad: int = 1) -> dict[str, float]:
    """Calcula CO₂ evitado y agua ahorrada para un tipo de residuo."""
    peso = PESO_PROMEDIO_ESCANEO.get(tipo, 0.05) * cantidad
    factores = IMPACTO_POR_KG.get(tipo, {"co2_evitado_kg": 0.1, "agua_ahorrada_lt": 1})
    return {
        "co2_evitado_kg": round(peso * factores["co2_evitado_kg"], 3),
        "agua_ahorrada_lt": round(peso * factores["agua_ahorrada_lt"], 1),
    }


def arboles_equivalentes(co2_kg: float) -> float:
    """Un árbol absorbe ~21 kg CO₂/año."""
    return round(co2_kg / 21, 2)
