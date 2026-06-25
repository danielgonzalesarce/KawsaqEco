"""Router POST /api/auth — Firebase vía backend (sin credenciales en mobile)."""

from fastapi import APIRouter, Depends, HTTPException

from models.schemas import (
    AuthResponse,
    GoogleAuthRequest,
    LoginPhoneRequest,
    LoginRequest,
    RegisterPhoneRequest,
    RegisterRequest,
    UserProfile,
)
from services.auth_deps import get_current_user
from services.auth_service import (
    auth_response_for_user,
    authenticate_user,
    public_user,
    register_user,
    upsert_oauth_user,
)
from services.firebase_auth_service import (
    auth_public_config,
    is_firebase_auth_ready,
    phone_to_email,
    profile_from_firebase_response,
    register_with_password,
    sign_in_with_google,
    sign_in_with_password,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/config")
async def auth_config():
    """Config pública para la app — Google client id, sin secretos."""
    return auth_public_config()


@router.post("/register", response_model=AuthResponse)
async def register(body: RegisterRequest):
    """Registro con correo y contraseña (Firebase Auth)."""
    if is_firebase_auth_ready():
        try:
            fb = await register_with_password(
                body.email.strip().lower(),
                body.password,
                body.nombre,
            )
            user = profile_from_firebase_response(
                fb, nombre=body.nombre, distrito=body.distrito,
            )
            upsert_oauth_user(
                uid=user["id"],
                email=user["email"],
                nombre=user["nombre"],
                distrito=user["distrito"],
                telefono=user.get("telefono"),
                provider=user.get("provider", "firebase"),
            )
            token, profile = auth_response_for_user(user)
            return AuthResponse(access_token=token, user=UserProfile(**profile))
        except ValueError as e:
            raise HTTPException(status_code=400, detail=str(e)) from e

    try:
        user = register_user(body.email, body.password, body.nombre, body.distrito)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    token, profile = auth_response_for_user(user)
    return AuthResponse(access_token=token, user=UserProfile(**profile))


@router.post("/register-phone", response_model=AuthResponse)
async def register_phone(body: RegisterPhoneRequest):
    """Registro con teléfono y contraseña (Firebase Auth)."""
    if not is_firebase_auth_ready():
        raise HTTPException(status_code=503, detail="Firebase Auth no configurado en el backend")

    email = phone_to_email(body.telefono)
    try:
        fb = await register_with_password(
            email,
            body.password,
            body.nombre,
            telefono=body.telefono,
        )
        user = profile_from_firebase_response(
            fb,
            nombre=body.nombre,
            distrito=body.distrito,
            telefono=body.telefono,
        )
        upsert_oauth_user(
            uid=user["id"],
            email=user["email"],
            nombre=user["nombre"],
            distrito=user["distrito"],
            telefono=user.get("telefono"),
            provider=user.get("provider", "firebase"),
        )
        token, profile = auth_response_for_user(user)
        return AuthResponse(access_token=token, user=UserProfile(**profile))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e


@router.post("/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    """Inicio de sesión con correo y contraseña."""
    email = body.email.strip().lower()

    local_user = authenticate_user(email, body.password)
    if local_user:
        token, profile = auth_response_for_user(local_user)
        return AuthResponse(access_token=token, user=UserProfile(**profile))

    if is_firebase_auth_ready():
        try:
            fb = await sign_in_with_password(email, body.password)
            user = profile_from_firebase_response(fb, distrito=body.distrito)
            upsert_oauth_user(
                uid=user["id"],
                email=user["email"],
                nombre=user["nombre"],
                distrito=user["distrito"],
                telefono=user.get("telefono"),
                provider=user.get("provider", "firebase"),
            )
            token, profile = auth_response_for_user(user)
            return AuthResponse(access_token=token, user=UserProfile(**profile))
        except ValueError as e:
            raise HTTPException(status_code=401, detail=str(e)) from e

    raise HTTPException(status_code=401, detail="Correo o contraseña incorrectos")


@router.post("/login-phone", response_model=AuthResponse)
async def login_phone(body: LoginPhoneRequest):
    """Inicio de sesión con teléfono y contraseña."""
    if not is_firebase_auth_ready():
        raise HTTPException(status_code=503, detail="Firebase Auth no configurado en el backend")

    email = phone_to_email(body.telefono)
    try:
        fb = await sign_in_with_password(email, body.password)
        user = profile_from_firebase_response(fb, telefono=body.telefono, distrito=body.distrito)
        upsert_oauth_user(
            uid=user["id"],
            email=user["email"],
            nombre=user["nombre"],
            distrito=user["distrito"],
            telefono=user.get("telefono"),
            provider=user.get("provider", "firebase"),
        )
        token, profile = auth_response_for_user(user)
        return AuthResponse(access_token=token, user=UserProfile(**profile))
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e)) from e


@router.post("/google", response_model=AuthResponse)
async def google_auth(body: GoogleAuthRequest):
    """Inicio/registro con Google (id_token del OAuth)."""
    if not is_firebase_auth_ready():
        raise HTTPException(status_code=503, detail="Firebase Auth no configurado en el backend")

    try:
        fb = await sign_in_with_google(body.id_token)
        user = profile_from_firebase_response(fb, nombre=body.nombre, distrito=body.distrito)
        upsert_oauth_user(
            uid=user["id"],
            email=user["email"],
            nombre=user["nombre"],
            distrito=user["distrito"],
            telefono=user.get("telefono"),
            provider=user.get("provider", "firebase"),
        )
        token, profile = auth_response_for_user(user)
        return AuthResponse(access_token=token, user=UserProfile(**profile))
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e)) from e


@router.get("/me", response_model=UserProfile)
async def me(user: dict = Depends(get_current_user)):
    return UserProfile(**public_user(user))
