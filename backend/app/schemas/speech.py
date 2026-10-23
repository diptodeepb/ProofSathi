"""Schemas for Text-to-Speech synthesis requests."""
from __future__ import annotations
from pydantic import BaseModel, Field
from app.schemas.common import AppLanguage


class SpeechRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1800)
    language: AppLanguage = AppLanguage.EN
    purpose: str = "document_summary"
