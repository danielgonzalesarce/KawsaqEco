"""Router GET /api/challenges — retos de gamificación."""

from fastapi import APIRouter, Depends

from services.auth_deps import assert_user_access, get_current_user, get_current_user_id
from services.challenges_service import check_and_award_challenges, get_challenges_for_user

router = APIRouter(prefix="/api", tags=["challenges"])


@router.get("/challenges/me")
async def my_challenges(user_id: str = Depends(get_current_user_id)):
    check_and_award_challenges(user_id)
    return {"retos": get_challenges_for_user(user_id)}


@router.get("/challenges/{user_id}")
async def user_challenges(user_id: str, user: dict = Depends(get_current_user)):
    assert_user_access(user_id, user)
    check_and_award_challenges(user_id)
    return {"retos": get_challenges_for_user(user_id)}
