"""Tests de canjes persistidos."""

from services.redemptions_service import add_redemption, get_user_redemptions


def test_redemption_persisted():
    uid = "test-redemption-user"
    add_redemption(uid, "r1", "ABCD1234")
    history = get_user_redemptions(uid)
    assert any(h["codigo"] == "ABCD1234" for h in history)
