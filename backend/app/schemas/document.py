"""Document schemas for analysis, fields, storage metadata, and history."""
from __future__ import annotations
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, Field
from app.schemas.common import AppLanguage, WorkflowType, DocumentType, ExtractionStatus


class DocumentClassificationResult(BaseModel):
    document_type: DocumentType = DocumentType.UNKNOWN
    workflow: WorkflowType = WorkflowType.DOCUMENT
    language_detected: str = "en"
    document_title: str = "Document"
    is_readable: bool = True
    needs_manual_review: bool = False
    warnings: List[str] = Field(default_factory=list)


class DocumentField(BaseModel):
    key: str
    label: str
    value: str
    normalized_value: Optional[Any] = None
    unit: Optional[str] = None
    source_text: str = ""
    extraction_status: ExtractionStatus = ExtractionStatus.MEDIUM
    needs_confirmation: bool = False


class StorageMetadata(BaseModel):
    provider: str = "cloudinary"
    original_stored: bool = False
    asset_id: Optional[str] = None
    public_id: Optional[str] = None
    resource_type: str = "image"
    delivery_type: str = "authenticated"
    expires_at: Optional[str] = None


class DocumentAnalysisResponse(BaseModel):
    document_id: str
    workflow: WorkflowType
    document_type: DocumentType
    language: AppLanguage
    summary: str
    fields: List[DocumentField] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)
    actions: List[Dict[str, Any]] = Field(default_factory=list)
    storage: Optional[StorageMetadata] = None
    created_at: str


class DocumentListItem(BaseModel):
    id: str
    workflow: WorkflowType
    document_type: DocumentType
    language: AppLanguage
    summary: str
    created_at: str
    field_count: int = 0
    warnings: List[str] = Field(default_factory=list)


class DocumentListResponse(BaseModel):
    items: List[DocumentListItem]
    total: int
