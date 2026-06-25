"""Tests de autenticación JWT."""

import uuid

from fastapi.testclient import TestClient

from main import app
from services.auth_service import create_access_token, register_user

client = TestClient(app)


def test_health():
    res = client.get("/")
    assert res.status_code == 200
    assert res.json()["status"] == "ok"


def test_points_requires_auth():
    res = client.get("/api/points/me")
    assert res.status_code == 401


def test_scan_requires_auth():
    res = client.post("/api/scan", json={"image_base64": "a" * 20})
    assert res.status_code == 401


def test_authenticated_points_flow():
    suffix = uuid.uuid4().hex[:8]
    email = f"test-ci-{suffix}@kawsaqeco.com"
    user = register_user(email, "testpass123", "Tester CI")
    token = create_access_token(user["id"], user["email"])
    headers = {"Authorization": f"Bearer {token}"}

    res = client.get("/api/points/me", headers=headers)
    assert res.status_code == 200
    assert res.json()["total_points"] == 0

    res = client.get(f"/api/points/{user['id']}", headers=headers)
    assert res.status_code == 200

    other = register_user(f"other-ci-{suffix}@kawsaqeco.com", "testpass123", "Otro")
    other_token = create_access_token(other["id"], other["email"])
    res = client.get(f"/api/points/{user['id']}", headers={"Authorization": f"Bearer {other_token}"})
    assert res.status_code == 403
