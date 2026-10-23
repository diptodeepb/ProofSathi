"""Preferences API endpoints for user language settings."""
from __future__ import annotations
from datetime import datetime, timezone
from fastapi import APIRouter, Header, Depends
from typing import Optional

from app.schemas.preference import PreferenceUpdate, PreferenceResponse
from app.repositories.preferences import preferences_repo
from app.utils.security import get_session_id

router = APIRouter(prefix="/preferences", tags=["Preferences"])


@router.get("", response_model=PreferenceResponse)
async def get_preferences(x_session_id: Optional[str] = Header(None)):
    session_id = get_session_id(x_session_id)
    pref = await preferences_repo.get_preference(session_id)
    if pref:
        return PreferenceResponse(
            language=pref.get("language", "en"),
            updated_at=pref.get("updated_at", datetime.now(timezone.utc).isoformat()),
        )
    return PreferenceResponse(
        language="en",
        updated_at=datetime.now(timezone.utc).isoformat(),
    )


@router.put("", response_model=PreferenceResponse)
async def update_preferences(
    body: PreferenceUpdate,
    x_session_id: Optional[str] = Header(None),
):
    session_id = get_session_id(x_session_id)
    updated = await preferences_repo.set_language(session_id, body.language.value)
    return PreferenceResponse(
        language=updated["language"],
        updated_at=updated["updated_at"],
    )
