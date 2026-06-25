"""Integración Firebase Firestore para persistencia de datos."""

import os
from datetime import datetime, timezone

from dotenv import load_dotenv

load_dotenv()

_db = None
DEMO_USER_ID = "demo-user"


def get_firestore():
    """Inicializa y devuelve cliente Firestore."""
    global _db
    if _db is not None:
        return _db

    cred_path = os.getenv("FIREBASE_CREDENTIALS_PATH", "")
    cred_json = os.getenv("FIREBASE_CREDENTIALS_JSON", "")
    project_id = os.getenv("FIREBASE_PROJECT_ID", "")

    if not project_id:
        return None

    if not cred_json and (not cred_path or not os.path.exists(cred_path)):
        return None

    try:
        import json

        import firebase_admin
        from firebase_admin import credentials, firestore

        if not firebase_admin._apps:
            if cred_json:
                cred = credentials.Certificate(json.loads(cred_json))
            else:
                cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred, {"projectId": project_id})

        _db = firestore.client()
        return _db
    except Exception:
        return None


def ensure_demo_user(user_id: str = DEMO_USER_ID) -> None:
    """Crea documento de usuario demo si no existe."""
    db = get_firestore()
    if not db:
        return
    try:
        ref = db.collection("users").document(user_id)
        if not ref.get().exists:
            ref.set({
                "nombre": "Usuario Demo KawsaqEco",
                "distrito": "Miraflores",
                "created_at": datetime.now(timezone.utc).isoformat(),
            })
    except Exception:
        pass


def insert_eco_points(user_id: str, action: str, points: int, metadata: dict | None = None) -> bool:
    """Registra puntos en Firestore."""
    db = get_firestore()
    if not db:
        return False
    try:
        db.collection("eco_points").add({
            "user_id": user_id,
            "action": action,
            "points": points,
            "metadata": metadata or {},
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        return True
    except Exception:
        return False


def get_user_total_points(user_id: str) -> int | None:
    """Suma total de puntos del usuario desde Firestore."""
    db = get_firestore()
    if not db:
        return None
    try:
        docs = db.collection("eco_points").where("user_id", "==", user_id).stream()
        return sum(doc.to_dict().get("points", 0) for doc in docs)
    except Exception:
        return None


def verify_firebase_token(id_token: str) -> dict | None:
    """Verifica ID token de Firebase Auth (Google, email, teléfono)."""
    if not get_firestore():
        return None
    try:
        from firebase_admin import auth as firebase_auth

        return firebase_auth.verify_id_token(id_token)
    except Exception:
        return None


def upsert_auth_user(
    uid: str,
    nombre: str,
    email: str,
    distrito: str = "Santa Anita",
    telefono: str | None = None,
    provider: str = "firebase",
) -> None:
    """Guarda o actualiza perfil en Firestore."""
    db = get_firestore()
    if not db:
        return
    try:
        ref = db.collection("users").document(uid)
        ref.set(
            {
                "nombre": nombre,
                "email": email,
                "distrito": distrito,
                "telefono": telefono,
                "provider": provider,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            },
            merge=True,
        )
    except Exception:
        pass
