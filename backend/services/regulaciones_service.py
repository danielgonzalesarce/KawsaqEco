"""Normativa local de reciclaje en Lima / Perú."""

import json
from pathlib import Path

_DATA = Path(__file__).resolve().parents[1] / "data" / "regulaciones_lima.json"
_cache: dict | None = None


def _load() -> dict:
    global _cache
    if _cache is None:
        with open(_DATA, encoding="utf-8") as f:
            _cache = json.load(f)
    return _cache


def get_regulacion(tipo: str) -> dict:
    data = _load()
    key = tipo.lower().strip() if tipo else "general"
    if key not in data:
        key = "general"
    return {"tipo": key, **data[key]}


def list_regulaciones() -> list[dict]:
    data = _load()
    return [{"tipo": k, "titulo": v["titulo"], "normativa": v["normativa"]} for k, v in data.items()]
