"""Persistencia de canjes de recompensas."""

import json
from datetime import datetime, timezone
from pathlib import Path

REDEMPTIONS_FILE = Path(__file__).resolve().parents[1] / "data" / "redemptions.json"
_redemptions: dict[str, list[dict]] = {}


def _load() -> None:
    global _redemptions
    if not REDEMPTIONS_FILE.exists():
        return
    try:
        with open(REDEMPTIONS_FILE, encoding="utf-8") as f:
            data = json.load(f)
        if isinstance(data, dict):
            _redemptions = data
    except Exception:
        pass


def _save() -> None:
    try:
        REDEMPTIONS_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(REDEMPTIONS_FILE, "w", encoding="utf-8") as f:
            json.dump(_redemptions, f, ensure_ascii=False, indent=2)
    except Exception:
        pass


_load()


def get_user_redemptions(user_id: str) -> list[dict]:
    return list(_redemptions.get(user_id, []))


def add_redemption(user_id: str, reward_id: str, codigo: str) -> dict:
    entry = {
        "codigo": codigo,
        "reward_id": reward_id,
        "fecha": datetime.now(timezone.utc).isoformat(),
    }
    _redemptions.setdefault(user_id, []).append(entry)
    _save()
    return entry
