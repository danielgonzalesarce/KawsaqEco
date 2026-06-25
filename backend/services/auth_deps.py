"""Dependencias FastAPI para autenticación JWT."""

from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from services.auth_service import decode_token, get_user_by_id

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer),
) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="No autenticado")
    payload = decode_token(credentials.credentials)
    if not payload or not payload.get("sub"):
        raise HTTPException(status_code=401, detail="Token inválido o expirado")
    user = get_user_by_id(str(payload["sub"]))
    if not user:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return user


def get_current_user_id(user: dict = Depends(get_current_user)) -> str:
    return str(user["id"])


def assert_user_access(requested_id: str, user: dict) -> None:
    if requested_id != user["id"]:
        raise HTTPException(status_code=403, detail="No puedes acceder a datos de otro usuario")
