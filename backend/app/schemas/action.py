"""Schemas for ProofPath action items, checklists, and document extraction."""
from __future__ import annotations
from typing import Optional, List
from pydantic import BaseModel, Field
from app.schemas.common import ActionStatus, ExtractionStatus


class ImportantDate(BaseModel):
    date: str
    meaning: str
    source_text: str = ""
    status: ExtractionStatus = ExtractionStatus.MEDIUM
    needs_confirmation: bool = False


class RequiredDocument(BaseModel):
    name: str
    source_text: str = ""
    status: ExtractionStatus = ExtractionStatus.MEDIUM
    needs_confirmation: bool = False


class ActionItemBase(BaseModel):
    title: str
    description: Optional[str] = None
    due_date: Optional[str] = None
    status: ActionStatus = ActionStatus.PENDING
    source_text: str = ""
    needs_confirmation: bool = False


class ActionItemCreate(ActionItemBase):
    document_id: Optional[str] = None


class ActionItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None
    status: Optional[ActionStatus] = None
    needs_confirmation: Optional[bool] = None


class ActionItemResponse(ActionItemBase):
    id: str
    document_id: Optional[str] = None
    created_at: str
    updated_at: str


class GeneralDocumentExtractionSchema(BaseModel):
    document_type: str = "pension_notice"
    title: str = "Notice"
    summary: str
    important_dates: List[ImportantDate] = Field(default_factory=list)
    required_documents: List[RequiredDocument] = Field(default_factory=list)
    actions: List[ActionItemCreate] = Field(default_factory=list)
    uncertainties: List[str] = Field(default_factory=list)
    safety_note: Optional[str] = "Confirm consequential instructions with the issuing organization."
