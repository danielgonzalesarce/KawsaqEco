"""Tests de distancia Haversine."""

from database.connection import haversine


def test_haversine_same_point():
    assert haversine(-12.05, -76.97, -12.05, -76.97) == 0.0


def test_haversine_known_distance():
    # ~1 km norte aproximado en Lima
    d = haversine(-12.0500, -76.9700, -12.0590, -76.9700)
    assert 900 < d < 1100
