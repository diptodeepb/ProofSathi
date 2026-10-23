"""Documents API endpoints for upload, analysis, retrieval, and deletion."""
from __future__ import annotations
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, Header, HTTPException, Query

from app.schemas.common import AppLanguage, WorkflowType
from app.schemas.document import DocumentAnalysisResponse, DocumentListResponse, DocumentListItem
from app.services.document_service import document_service
from app.repositories.documents import documents_repo
from app.utils.security import get_session_id

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.post("/analyze", response_model=DocumentAnalysisResponse)
async def analyze_document(
    file: UploadFile = File(...),
    workflow: WorkflowType = Form(WorkflowType.BILL),
    language: AppLanguage = Form(AppLanguage.EN),
    consent_to_ai_processing: bool = Form(True),
    x_session_id: Optional[str] = Header(None),
):
    if not consent_to_ai_processing:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "CONSENT_REQUIRED",
                "message": "User consent to AI processing is required to analyze documents.",
                "retryable": False,
            },
        )

    session_id = get_session_id(x_session_id)
    raw_bytes = await file.read()

    result = await document_service.analyze_document(
        raw_bytes=raw_bytes,
        workflow=workflow,
        language=language,
        owner_id=session_id,
        filename=file.filename or "",
    )
    return result


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    workflow: Optional[WorkflowType] = Query(None),
    limit: int = Query(20, ge=1, le=100),
    x_session_id: Optional[str] = Header(None),
):
    session_id = get_session_id(x_session_id)
    wf_val = workflow.value if workflow else None
    docs = await documents_repo.list_documents(session_id, workflow=wf_val, limit=limit)

    items = [
        DocumentListItem(
            id=d.get("id") or d.get("_id"),
            workflow=d.get("workflow", WorkflowType.DOCUMENT),
            document_type=d.get("document_type", "other"),
            language=d.get("language", AppLanguage.EN),
            summary=d.get("summary", ""),
            created_at=d.get("created_at", ""),
            field_count=len(d.get("fields", [])),
            warnings=d.get("warnings", []),
        )
        for d in docs
    ]
    return DocumentListResponse(items=items, total=len(items))


@router.get("/{document_id}", response_model=DocumentAnalysisResponse)
async def get_document(
    document_id: str,
    x_session_id: Optional[str] = Header(None),
):
    session_id = get_session_id(x_session_id)
    doc = await documents_repo.get_document(document_id, session_id)
    if not doc:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Document not found.", "retryable": False},
        )

    return DocumentAnalysisResponse(
        document_id=doc.get("id") or doc.get("_id"),
        workflow=doc.get("workflow"),
        document_type=doc.get("document_type"),
        language=doc.get("language"),
        summary=doc.get("summary", ""),
        fields=doc.get("fields", []),
        warnings=doc.get("warnings", []),
        actions=doc.get("actions", []),
        storage=doc.get("storage"),
        created_at=doc.get("created_at", ""),
    )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    x_session_id: Optional[str] = Header(None),
):
    session_id = get_session_id(x_session_id)
    success = await documents_repo.delete_document(document_id, session_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Document not found or unauthorized.", "retryable": False},
        )
    return {"status": "deleted", "document_id": document_id}
