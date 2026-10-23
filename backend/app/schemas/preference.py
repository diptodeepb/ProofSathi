"""Schemas for user preferences (language)."""
from __future__ import annotations
from pydantic import BaseModel
from app.schemas.common import AppLanguage


class PreferenceUpdate(BaseModel):
    language: AppLanguage


class PreferenceResponse(BaseModel):
    language: AppLanguage
    updated_at: str
