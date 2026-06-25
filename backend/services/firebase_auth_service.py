"""Autenticación Firebase vía backend — usa firebase-credentials.json del proyecto."""

import os
import re

import httpx

from database.acopio_santa_anita import DISTRITO_FOCO
from services.firebase_service import get_firestore, upsert_auth_user, verify_firebase_token

FIREBASE_WEB_API_KEY = os.getenv("FIREBASE_WEB_API_KEY", "")
GOOGLE_WEB_CLIENT_ID = os.getenv("GOOGLE_WEB_CLIENT_ID", "")
_IDENTITY_BASE = "https://identitytoolkit.googleapis.com/v1"


def is_firebase_auth_ready() -> bool:
    """True si Firestore/Admin y API key web están configurados."""
    return bool(get_firestore() and FIREBASE_WEB_API_KEY)


def auth_public_config() -> dict:
    return {
        "firebase": is_firebase_auth_ready(),
        "google_web_client_id": GOOGLE_WEB_CLIENT_ID or None,
        "project_id": os.getenv("FIREBASE_PROJECT_ID", "kawsaqeco"),
        "google_cloud_project_number": "932892906896",
        "google_oauth_redirect_uris": [
            "https://kawsaqeco.firebaseapp.com/__/auth/handler",
        ],
        "google_android_setup": {
            "package_name": "com.kawsaqeco.app",
            "note": "Crear cliente OAuth Android con SHA-1 del debug keystore. Ver docs/google-oauth-setup.md",
        },
        "google_setup": {
            "credentials_url": "https://console.cloud.google.com/apis/credentials?project=932892906896",
            "consent_screen_url": "https://console.cloud.google.com/apis/credentials/consent?project=932892906896",
            "firebase_google_url": "https://console.firebase.google.com/project/kawsaqeco/authentication/providers",
        },
    }


def normalize_peru_phone(phone: str) -> str:
    digits = re.sub(r"\D", "", phone)
    if digits.startswith("51") and len(digits) == 11:
        return f"+{digits}"
    if len(digits) == 9:
        return f"+51{digits}"
    if phone.strip().startswith("+"):
        return f"+{digits}"
    return f"+51{digits[-9:]}"


def phone_to_email(phone: str) -> str:
    e164 = normalize_peru_phone(phone)
    digits = re.sub(r"\D", "", e164)
    return f"{digits}@phone.kawsaqeco.app"


def _map_firebase_error(message: str) -> str:
    mapping = {
        "EMAIL_EXISTS": "Este correo o teléfono ya está registrado",
        "EMAIL_NOT_FOUND": "Usuario no encontrado",
        "INVALID_PASSWORD": "Contraseña incorrecta",
        "INVALID_LOGIN_CREDENTIALS": "Correo/teléfono o contraseña incorrectos",
        "WEAK_PASSWORD": "La contraseña debe tener al menos 6 caracteres",
        "TOO_MANY_ATTEMPTS_TRY_LATER": "Demasiados intentos. Espera un momento.",
    }
    return mapping.get(message, message.replace("_", " ").capitalize())


async def _identity_post(path: str, payload: dict) -> dict:
    if not FIREBASE_WEB_API_KEY:
        raise ValueError("FIREBASE_WEB_API_KEY no configurada en backend/.env")
    url = f"{_IDENTITY_BASE}/{path}?key={FIREBASE_WEB_API_KEY}"
    async with httpx.AsyncClient(timeout=15) as client:
        resp = await client.post(url, json=payload)
    if resp.status_code != 200:
        detail = resp.json().get("error", {}).get("message", "Error de Firebase Auth")
        raise ValueError(_map_firebase_error(detail))
    return resp.json()


async def sign_in_with_password(email: str, password: str) -> dict:
    return await _identity_post(
        "accounts:signInWithPassword",
        {"email": email, "password": password, "returnSecureToken": True},
    )


async def register_with_password(
    email: str,
    password: str,
    nombre: str,
    telefono: str | None = None,
) -> dict:
    """Registro email/contraseña. Teléfono solo se guarda en perfil local, no en signUp."""
    payload: dict = {
        "email": email,
        "password": password,
        "returnSecureToken": True,
    }
    if nombre.strip():
        payload["displayName"] = nombre.strip()
    return await _identity_post("accounts:signUp", payload)


async def sign_in_with_google(google_id_token: str) -> dict:
    post_body = f"id_token={google_id_token}&providerId=google.com"
    return await _identity_post(
        "accounts:signInWithIdp",
        {
            "postBody": post_body,
            "requestUri": "http://localhost",
            "returnIdpCredential": True,
            "returnSecureToken": True,
        },
    )


def profile_from_firebase_response(
    fb: dict,
    nombre: str | None = None,
    distrito: str | None = None,
    telefono: str | None = None,
) -> dict:
    """Convierte respuesta Identity Toolkit en perfil KawsaqEco."""
    id_token = fb.get("idToken")
    claims = verify_firebase_token(id_token) if id_token else None

    if claims:
        uid = str(claims.get("uid") or claims.get("sub"))
        email = claims.get("email") or fb.get("email", "")
        phone = telefono or claims.get("phone_number") or fb.get("phoneNumber")
        display_name = (
            nombre
            or claims.get("name")
            or fb.get("displayName")
            or (email.split("@")[0] if email and "@" in email else "Reciclador KawsaqEco")
        )
        provider = (claims.get("firebase") or {}).get("sign_in_provider", "firebase")
    else:
        uid = fb.get("localId")
        if not uid:
            raise ValueError("Respuesta de Firebase incompleta")
        email = fb.get("email", "")
        phone = telefono or fb.get("phoneNumber")
        display_name = (
            nombre
            or fb.get("displayName")
            or (email.split("@")[0] if email and "@" in email else "Reciclador KawsaqEco")
        )
        provider = "password"

    display_email = email
    if email.endswith("@phone.kawsaqeco.app"):
        if telefono:
            display_email = normalize_peru_phone(telefono)
            phone = display_email
        else:
            digits = email.split("@")[0]
            display_email = f"+{digits}" if digits else email
            phone = phone or display_email

    user = {
        "id": uid,
        "email": display_email or f"{uid}@firebase.local",
        "nombre": display_name,
        "distrito": (distrito or DISTRITO_FOCO).strip(),
        "telefono": phone,
        "provider": provider,
    }
    upsert_auth_user(
        uid=uid,
        nombre=user["nombre"],
        email=user["email"],
        distrito=user["distrito"],
        telefono=user.get("telefono"),
        provider=user.get("provider", "firebase"),
    )
    return user
