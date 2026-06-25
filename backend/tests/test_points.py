"""Tests de puntos y niveles."""

import uuid

from services.points_service import obtener_nivel, registrar_puntos, obtener_total


def test_niveles_semilla():
    nombre, emoji, proximo, faltantes = obtener_nivel(0)
    assert nombre == "Semilla"
    assert emoji == "🌱"
    assert proximo == "Brote"
    assert faltantes == 200


def test_niveles_arbol():
    nombre, _, proximo, faltantes = obtener_nivel(500)
    assert nombre == "Árbol"
    assert proximo == "Guardián"
    assert faltantes == 500


def test_registrar_puntos_acumula():
    uid = f"test-points-{uuid.uuid4().hex}"
    registrar_puntos(uid, "SCAN_RESIDUO", 10, {"tipo": "plástico"})
    registrar_puntos(uid, "ACOPIO_VERIFICADO")
    total = obtener_total(uid)
    assert total == 30
