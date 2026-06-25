"""Modelos Pydantic v2 para la API KawsaqEco."""

from datetime import datetime
from typing import Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


ResidueType = Literal[
    "plástico", "papel", "vidrio", "orgánico", "metal",
    "electrónico", "peligroso", "no_identificado", "no_es_residuo",
]


class ScanRequest(BaseModel):
    """Solicitud de escaneo con imagen en base64."""
    image_base64: str = Field(..., min_length=10)
    user_id: str | None = None
    lat: float | None = None
    lng: float | None = None


class ScanResponse(BaseModel):
    """Resultado del escaneo de residuo."""
    tipo: str
    confianza: float
    nombre_especifico: str
    instrucciones: str
    reciclable: bool
    puntos: int
    dato_impacto: str = ""
    acopio_cercano: dict[str, Any] | None = None
    impacto: dict[str, float] | None = None
    regulacion: dict[str, Any] | None = None
    modo_ia: str = "demo"
    sugerir_retake: bool = False


class ChatMessage(BaseModel):
    """Mensaje individual del historial de chat."""
    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """Solicitud al agente Kawsaq."""
    message: str = Field(..., min_length=1, max_length=2000)
    user_id: str | None = None
    conversation_history: list[ChatMessage] = Field(default_factory=list)
    distrito: str | None = None
    lat: float | None = None
    lng: float | None = None


class ChatResponse(BaseModel):
    """Respuesta del agente conversacional."""
    reply: str
    suggested_actions: list[str] = Field(default_factory=list)


class PointsActionRequest(BaseModel):
    """Registro de acción de puntos."""
    user_id: str
    action: str
    points: int | None = None
    metadata: dict[str, Any] | None = None


class AcopioVerifyRequest(BaseModel):
    """Confirmación de entrega en acopio con verificación GPS."""
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    acopio_id: str | None = None


class AcopioGeofenceStatus(BaseModel):
    """Resultado de comprobación de proximidad."""
    ok: bool
    distancia_m: int
    radio_max_m: int
    acopio_id: str | None = None
    acopio_nombre: str | None = None


class PointsSummary(BaseModel):
    """Resumen de puntos y nivel del usuario."""
    user_id: str
    total_points: int
    nivel: str
    emoji: str
    proximo_nivel: str | None = None
    puntos_faltantes: int = 0


class AcopioPoint(BaseModel):
    """Punto de acopio en Santa Anita."""
    id: str
    nombre: str
    distrito: str
    direccion: str
    tipos_residuo: list[str]
    horario: str
    lat: float
    lng: float
    distancia_m: float | None = None
    zona: str | None = None
    tipo_entidad: str | None = None


class RewardItem(BaseModel):
    """Recompensa canjeable."""
    id: str
    nombre: str
    descripcion: str
    puntos_requeridos: int
    tipo: str
    partner: str
    valor_monetario: float
    stock: int


class RedeemRequest(BaseModel):
    """Solicitud de canje de recompensa."""
    user_id: str | None = None
    reward_id: str


class RedeemResponse(BaseModel):
    """Resultado del canje."""
    codigo_canje: str
    reward: RewardItem
    puntos_restantes: int


class RedemptionHistoryItem(BaseModel):
    """Canje realizado por el usuario."""
    codigo: str
    reward_id: str
    reward_nombre: str
    puntos_gastados: int
    fecha: str


class LeaderboardEntry(BaseModel):
    """Entrada del ranking."""
    nombre: str
    total_points: int
    posicion: int


class ChallengeItem(BaseModel):
    """Reto de gamificación activo."""
    id: str
    nombre: str
    descripcion: str
    meta: int
    puntos_recompensa: int
    tipo: str
    icono: str
    progreso: int = 0
    completado: bool = False
    porcentaje: int = 0


class HomeSummary(BaseModel):
    """Resumen consolidado para la pantalla Home."""
    puntos: int
    nivel: str
    emoji: str
    co2_evitado_kg: float
    agua_ahorrada_lt: float
    arboles_equivalentes: float
    distrito_foco: str = "Santa Anita"
    puntos_acopio: int = 5
    tip_personalizado: str = ""
    escaneos_total: int = 0
    ranking_top: list[LeaderboardEntry] = Field(default_factory=list)
    residuo_frecuente: str = ""
    reto_sugerido: str = ""
    proyeccion_anual_co2: float = 0.0
    retos: list[ChallengeItem] = Field(default_factory=list)
    usuarios_comunidad: int = 0
    racha_dias: int = 0
    modo_ia_scan: str = "demo"


class ImpactSummary(BaseModel):
    """Resumen de impacto ambiental del usuario."""
    co2_evitado_kg: float
    agua_ahorrada_lt: float
    arboles_equivalentes: float
    residuos_por_tipo: dict[str, int]
    proyeccion_anual_co2: float


class RegisterRequest(BaseModel):
    """Registro de usuario."""
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    nombre: str = Field(..., min_length=2, max_length=100)
    distrito: str | None = "Santa Anita"


class RegisterPhoneRequest(BaseModel):
    """Registro con teléfono y contraseña (Firebase)."""
    telefono: str = Field(..., min_length=9, max_length=20)
    password: str = Field(..., min_length=6, max_length=128)
    nombre: str = Field(..., min_length=2, max_length=100)
    distrito: str | None = "Santa Anita"


class LoginPhoneRequest(BaseModel):
    """Inicio de sesión con teléfono y contraseña."""
    telefono: str = Field(..., min_length=9, max_length=20)
    password: str = Field(..., min_length=1, max_length=128)
    distrito: str | None = "Santa Anita"


class LoginRequest(BaseModel):
    """Inicio de sesión."""
    email: str = Field(..., min_length=5, max_length=255)
    password: str = Field(..., min_length=1, max_length=128)
    distrito: str | None = "Santa Anita"


class GoogleAuthRequest(BaseModel):
    """Google Sign-In — id_token obtenido en el dispositivo."""
    id_token: str = Field(..., min_length=20)
    nombre: str | None = None
    distrito: str | None = "Santa Anita"


class UserProfile(BaseModel):
    """Perfil público del usuario."""
    id: str
    email: str
    nombre: str
    distrito: str


class AuthResponse(BaseModel):
    """Respuesta de login/registro."""
    access_token: str
    token_type: str = "bearer"
    user: UserProfile

