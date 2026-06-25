"""Autenticación JWT — registro e inicio de sesión (persistencia JSON local)."""

import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any

import bcrypt
import jwt

from database.acopio_santa_anita import DISTRITO_FOCO

JWT_SECRET = os.getenv("JWT_SECRET", "kawsaqeco-dev-secret-cambiar-en-produccion")
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_HOURS = int(os.getenv("JWT_EXPIRE_HOURS", "168"))

_USERS_FILE = Path(__file__).resolve().parent.parent / "data" / "users_auth.json"
_users: dict[str, dict[str, Any]] = {}


def _load_users() -> None:
    global _users
    if _USERS_FILE.exists():
        try:
            raw = json.loads(_USERS_FILE.read_text(encoding="utf-8"))
            _users = raw if isinstance(raw, dict) else {}
        except (json.JSONDecodeError, OSError):
            _users = {}
    _seed_demo_user()


def _save_users() -> None:
    _USERS_FILE.parent.mkdir(parents=True, exist_ok=True)
    _USERS_FILE.write_text(json.dumps(_users, indent=2, ensure_ascii=False), encoding="utf-8")


def _seed_demo_user() -> None:
    demo_email = "demo@kawsaqeco.com"
    if demo_email not in _users:
        _users[demo_email] = {
            "id": "demo-user",
            "email": demo_email,
            "nombre": "Usuario Demo",
            "distrito": DISTRITO_FOCO,
            "password_hash": hash_password("demo1234"),
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        _save_users()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_access_token(user_id: str, email: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {"sub": user_id, "email": email, "exp": expire}
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> dict[str, Any] | None:
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.PyJWTError:
        return None


def get_user_by_email(email: str) -> dict[str, Any] | None:
    return _users.get(email.strip().lower())


def get_user_by_id(user_id: str) -> dict[str, Any] | None:
    for user in _users.values():
        if user["id"] == user_id:
            return user
    return None


def public_user(user: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": user["id"],
        "email": user["email"],
        "nombre": user["nombre"],
        "distrito": user.get("distrito", DISTRITO_FOCO),
    }


def register_user(email: str, password: str, nombre: str, distrito: str | None = None) -> dict[str, Any]:
    key = email.strip().lower()
    if key in _users:
        raise ValueError("Este correo ya está registrado")
    if len(password) < 6:
        raise ValueError("La contraseña debe tener al menos 6 caracteres")

    user = {
        "id": str(uuid.uuid4()),
        "email": key,
        "nombre": nombre.strip(),
        "distrito": (distrito or DISTRITO_FOCO).strip(),
        "password_hash": hash_password(password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _users[key] = user
    _save_users()
    return user


def authenticate_user(email: str, password: str) -> dict[str, Any] | None:
    user = get_user_by_email(email)
    if not user or not user.get("password_hash"):
        return None
    if not verify_password(password, user["password_hash"]):
        return None
    return user


def upsert_oauth_user(
    uid: str,
    email: str,
    nombre: str,
    distrito: str | None = None,
    telefono: str | None = None,
    provider: str = "firebase",
) -> dict[str, Any]:
    """Registra o actualiza usuario autenticado vía Firebase."""
    key = email.strip().lower() if email and "@" in email else uid
    user = {
        "id": uid,
        "email": email or f"{uid}@firebase.local",
        "nombre": nombre.strip() or "Reciclador KawsaqEco",
        "distrito": (distrito or DISTRITO_FOCO).strip(),
        "telefono": telefono,
        "provider": provider,
        "password_hash": "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _users[key] = user
    _save_users()
    return user


def user_from_firebase_claims(
    claims: dict[str, Any],
    nombre: str | None = None,
    distrito: str | None = None,
    telefono: str | None = None,
) -> dict[str, Any]:
    """Construye perfil local a partir del token verificado de Firebase."""
    uid = str(claims["uid"])
    email = claims.get("email") or ""
    phone = telefono or claims.get("phone_number")
    provider = (claims.get("firebase") or {}).get("sign_in_provider", "firebase")

    display_email = email
    if email.endswith("@phone.kawsaqeco.app") and phone:
        display_email = phone
    elif not email and phone:
        display_email = phone

    display_name = (
        claims.get("name")
        or nombre
        or (email.split("@")[0] if email and "@" in email else None)
        or "Reciclador KawsaqEco"
    )

    return upsert_oauth_user(
        uid=uid,
        email=display_email or f"{uid}@firebase.local",
        nombre=display_name,
        distrito=distrito,
        telefono=phone,
        provider=provider,
    )


def auth_response_for_user(user: dict[str, Any]) -> tuple[str, dict[str, Any]]:
    token = create_access_token(user["id"], user["email"])
    return token, public_user(user)


_load_users()
