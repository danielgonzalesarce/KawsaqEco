"""Tests de geofencing en acopio."""

from services.geofence_service import check_acopio_geofence, geofence_error_message


def test_geofence_at_acopio_point():
    # Municipalidad de Santa Anita
    check = check_acopio_geofence(-12.0439, -76.9714, acopio_id="mun-santa-anita", radius_m=150)
    assert check["ok"] is True
    assert check["distancia_m"] == 0


def test_geofence_too_far():
    check = check_acopio_geofence(-12.0439, -76.9714, acopio_id="mun-santa-anita", radius_m=50)
    # Mismo punto — sigue ok
    assert check["ok"] is True

    # ~2 km al sur
    check_far = check_acopio_geofence(-12.062, -76.9714, acopio_id="mun-santa-anita", radius_m=150)
    assert check_far["ok"] is False
    assert check_far["distancia_m"] > 150
    assert "Debes estar" in geofence_error_message(check_far)


def test_geofence_nearest_without_id():
    check = check_acopio_geofence(-12.0439, -76.9714, radius_m=200)
    assert check["ok"] is True
    assert check["acopio_id"] is not None
