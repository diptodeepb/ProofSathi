"""Actions API endpoints for ProofPath action tracking."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Header, HTTPException, Query

from app.schemas.action import ActionItemCreate, ActionItemUpdate, ActionItemResponse
from app.repositories.actions import actions_repo
from app.utils.security import get_session_id
from app.utils.dates import parse_and_normalize_date

router = APIRouter(prefix="/actions", tags=["Actions"])


@router.get("", response_model=List[ActionItemResponse])
async def list_actions(
    document_id: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    x_session_id: Optional[str] = Header(None),
):
    session_id = get_session_id(x_session_id)
    items = await actions_repo.list_actions(session_id, document_id=document_id, status=status)
    return [
        ActionItemResponse(
            id=i.get("id") or i.get("_id"),
            document_id=i.get("document_id"),
            title=i.get("title", ""),
            description=i.get("description"),
            due_date=i.get("due_date"),
            status=i.get("status", "pending"),
            source_text=i.get("source_text", ""),
            needs_confirmation=i.get("needs_confirmation", False),
            created_at=i.get("created_at", ""),
            updated_at=i.get("updated_at", ""),
        )
        for i in items
    ]


@router.post("", response_model=ActionItemResponse)
async def create_action(
    body: ActionItemCreate,
    x_session_id: Optional[str] = Header(None),
):
    session_id = get_session_id(x_session_id)
    aid = f"act_{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    due_norm = None
    if body.due_date:
        due_norm, _, _ = parse_and_normalize_date(body.due_date)

    action_record = {
        "id": aid,
        "_id": aid,
        "owner_id": session_id,
        "document_id": body.document_id,
        "title": body.title,
        "description": body.description,
        "due_date": due_norm or body.due_date,
        "status": body.status.value,
        "source_text": body.source_text or "",
        "needs_confirmation": body.needs_confirmation or (not bool(body.source_text)),
        "created_at": now_iso,
        "updated_at": now_iso,
    }
    await actions_repo.insert_action(action_record)

    return ActionItemResponse(**action_record)


@router.patch("/{action_id}", response_model=ActionItemResponse)
async def update_action(
    action_id: str,
    body: ActionItemUpdate,
    x_session_id: Optional[str] = Header(None),
):
    session_id = get_session_id(x_session_id)
    existing = await actions_repo.get_action(action_id, session_id)
    if not existing:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Action item not found or unauthorized.", "retryable": False},
        )

    updates = {}
    if body.title is not None:
        updates["title"] = body.title
    if body.description is not None:
        updates["description"] = body.description
    if body.due_date is not None:
        norm_d, _, _ = parse_and_normalize_date(body.due_date)
        updates["due_date"] = norm_d or body.due_date
    if body.status is not None:
        updates["status"] = body.status.value
    if body.needs_confirmation is not None:
        updates["needs_confirmation"] = body.needs_confirmation

    updated = await actions_repo.update_action(action_id, session_id, updates)
    if not updated:
        raise HTTPException(
            status_code=500,
            detail={"code": "INTERNAL_ERROR", "message": "Failed to update action item.", "retryable": True},
        )

    return ActionItemResponse(
        id=updated.get("id") or updated.get("_id"),
        document_id=updated.get("document_id"),
        title=updated.get("title", ""),
        description=updated.get("description"),
        due_date=updated.get("due_date"),
        status=updated.get("status", "pending"),
        source_text=updated.get("source_text", ""),
        needs_confirmation=updated.get("needs_confirmation", False),
        created_at=updated.get("created_at", ""),
        updated_at=updated.get("updated_at", ""),
    )


@router.delete("/{action_id}")
async def delete_action(
    action_id: str,
    x_session_id: Optional[str] = Header(None),
):
    session_id = get_session_id(x_session_id)
    success = await actions_repo.delete_action(action_id, session_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Action item not found or unauthorized.", "retryable": False},
        )
    return {"status": "deleted", "action_id": action_id}
