"""Router GET/POST /api/rewards — puntos canjeables (Santa Anita)."""

import secrets

from fastapi import APIRouter, Depends, HTTPException

from models.schemas import RewardItem, RedeemRequest, RedeemResponse, RedemptionHistoryItem
from services.auth_deps import assert_user_access, get_current_user, get_current_user_id
from services.points_service import obtener_total, registrar_puntos
from services.redemptions_service import add_redemption, get_user_redemptions
from database.connection import REWARDS_CATALOG

router = APIRouter(prefix="/api", tags=["rewards"])


@router.get("/rewards", response_model=list[RewardItem])
async def list_rewards():
    """Catálogo de recompensas canjeables en Santa Anita."""
    return [RewardItem(**r) for r in REWARDS_CATALOG]


@router.get("/rewards/balance/me")
async def my_rewards_balance(user_id: str = Depends(get_current_user_id)):
    """Saldo de puntos disponibles para canje."""
    return {"user_id": user_id, "puntos": obtener_total(user_id)}


@router.get("/rewards/balance/{user_id}")
async def rewards_balance(user_id: str, user: dict = Depends(get_current_user)):
    """Saldo de puntos disponibles para canje."""
    assert_user_access(user_id, user)
    return {"user_id": user_id, "puntos": obtener_total(user_id)}


@router.get("/rewards/history/me", response_model=list[RedemptionHistoryItem])
async def my_redemption_history(user_id: str = Depends(get_current_user_id)):
    return _history_for_user(user_id)


@router.get("/rewards/history/{user_id}", response_model=list[RedemptionHistoryItem])
async def redemption_history(user_id: str, user: dict = Depends(get_current_user)):
    """Historial de canjes del usuario."""
    assert_user_access(user_id, user)
    return _history_for_user(user_id)


def _history_for_user(user_id: str) -> list[RedemptionHistoryItem]:
    items = []
    for entry in get_user_redemptions(user_id):
        reward = next((r for r in REWARDS_CATALOG if r["id"] == entry["reward_id"]), None)
        items.append(
            RedemptionHistoryItem(
                codigo=entry["codigo"],
                reward_id=entry["reward_id"],
                reward_nombre=reward["nombre"] if reward else entry["reward_id"],
                puntos_gastados=reward["puntos_requeridos"] if reward else 0,
                fecha=entry.get("fecha", ""),
            )
        )
    return list(reversed(items))


@router.post("/rewards/redeem", response_model=RedeemResponse)
async def redeem_reward(body: RedeemRequest, user: dict = Depends(get_current_user)):
    """Canjea recompensa si el usuario tiene puntos suficientes."""
    user_id = user["id"]
    if body.user_id and body.user_id != user_id:
        raise HTTPException(status_code=403, detail="No puedes canjear como otro usuario")

    reward = next((r for r in REWARDS_CATALOG if r["id"] == body.reward_id), None)
    if not reward:
        raise HTTPException(status_code=404, detail="Recompensa no encontrada")

    if reward["stock"] == 0:
        raise HTTPException(status_code=400, detail="Recompensa agotada")

    total = obtener_total(user_id)
    if total < reward["puntos_requeridos"]:
        raise HTTPException(status_code=400, detail="Puntos insuficientes")

    codigo = secrets.token_hex(4).upper()
    registrar_puntos(user_id, "REDEEM", -reward["puntos_requeridos"], {"reward_id": body.reward_id})
    add_redemption(user_id, body.reward_id, codigo)

    if reward["stock"] > 0:
        reward["stock"] -= 1

    return RedeemResponse(
        codigo_canje=codigo,
        reward=RewardItem(**reward),
        puntos_restantes=obtener_total(user_id),
    )
