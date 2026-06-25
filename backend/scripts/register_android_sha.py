#!/usr/bin/env python3
"""Registra la app Android y el SHA-1 debug en Firebase (corrige DEVELOPER_ERROR de Google Sign-In)."""

from __future__ import annotations

import json
import sys
import time
from pathlib import Path

import httpx
from google.auth.transport.requests import Request
from google.oauth2 import service_account

ROOT = Path(__file__).resolve().parents[1]
CREDS_PATH = ROOT / "firebase-credentials.json"
PACKAGE = "com.kawsaqeco.app"
PROJECT = "kawsaqeco"
# SHA-1 debug keystore de esta máquina (actualizar si cambia el keystore)
DEFAULT_SHA1 = "3485398D1DC747E99B1CAB04F9ADD381BFDB3F90"
SCOPES = ["https://www.googleapis.com/auth/cloud-platform"]
BASE = f"https://firebase.googleapis.com/v1beta1/projects/{PROJECT}"


def auth_headers() -> dict[str, str]:
    creds = service_account.Credentials.from_service_account_file(str(CREDS_PATH), scopes=SCOPES)
    creds.refresh(Request())
    return {"Authorization": f"Bearer {creds.token}", "Content-Type": "application/json"}


def wait_operation(client: httpx.Client, op_name: str) -> dict:
    url = f"https://firebase.googleapis.com/v1beta1/{op_name}"
    for _ in range(40):
        resp = client.get(url, headers=auth_headers(), timeout=30)
        resp.raise_for_status()
        data = resp.json()
        if data.get("done"):
            if "error" in data:
                raise RuntimeError(data["error"])
            return data.get("response") or data
        time.sleep(2)
    raise TimeoutError(f"Operación Firebase no terminó: {op_name}")


def find_android_app(client: httpx.Client) -> dict | None:
    resp = client.get(f"{BASE}/androidApps", headers=auth_headers(), timeout=30)
    resp.raise_for_status()
    apps = resp.json().get("apps", [])
    return next((a for a in apps if a.get("packageName") == PACKAGE), None)


def ensure_android_app(client: httpx.Client) -> dict:
    app = find_android_app(client)
    if app:
        return app

    resp = client.post(
        f"{BASE}/androidApps",
        headers=auth_headers(),
        json={"packageName": PACKAGE, "displayName": "KawsaqEco"},
        timeout=30,
    )
    resp.raise_for_status()
    op = resp.json().get("name")
    if op:
        created = wait_operation(client, op)
        if created.get("name"):
            return created

    app = find_android_app(client)
    if not app:
        raise RuntimeError("No se pudo crear ni encontrar la app Android en Firebase")
    return app


def download_google_services(client: httpx.Client, app_name: str, out: Path) -> None:
    resp = client.get(
        f"https://firebase.googleapis.com/v1beta1/{app_name}/config",
        headers=auth_headers(),
        timeout=30,
    )
    resp.raise_for_status()
    payload = resp.json()
    raw = payload.get("configFileContents")
    if raw:
        import base64

        out.write_text(base64.b64decode(raw).decode(), encoding="utf-8")
    else:
        out.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    print(f"google-services.json guardado en {out}")


def main() -> int:
    if not CREDS_PATH.exists():
        print(f"Falta {CREDS_PATH}", file=sys.stderr)
        return 1

    sha1 = (sys.argv[1] if len(sys.argv) > 1 else DEFAULT_SHA1).replace(":", "").upper()
    out = ROOT.parent / "mobile" / "google-services.json"

    with httpx.Client() as client:
        app = ensure_android_app(client)
        app_name = app["name"]
        print(f"App Android: {app_name}")

        # Nota: la API shaCertificates puede devolver 404 si el SA no tiene permisos.
        # En ese caso, agrega el SHA-1 manualmente en Firebase Console.
        sha_url = f"https://firebase.googleapis.com/v1beta1/{app_name}/shaCertificates"
        list_resp = client.get(sha_url, headers=auth_headers(), timeout=30)
        if list_resp.status_code == 200:
            existing = {c.get("shaHash", "").upper() for c in list_resp.json().get("certificates", [])}
            if sha1 not in existing:
                add_resp = client.post(
                    sha_url,
                    headers=auth_headers(),
                    json={"shaHash": sha1, "certType": "SHA_1"},
                    timeout=30,
                )
                print("Registrar SHA-1:", add_resp.status_code, add_resp.text[:300])
            else:
                print("SHA-1 ya registrado en Firebase")
        else:
            print(
                "No se pudo registrar SHA-1 por API (agrega manualmente en Firebase Console):\n"
                f"  SHA-1: {':'.join(sha1[i:i+2] for i in range(0, len(sha1), 2))}\n"
                f"  https://console.firebase.google.com/project/{PROJECT}/settings/general"
            )

        download_google_services(client, app_name, out)

    print("\nSiguiente paso: cd mobile && npm run android:dev")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
