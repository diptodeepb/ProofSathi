"""Bills API endpoints for BillSaathi comparison."""
from __future__ import annotations
from typing import Optional
from fastapi import APIRouter, Header, HTTPException

from app.schemas.bill import BillComparisonRequest, BillComparisonResponse
from app.services.comparison_service import comparison_service
from app.repositories.documents import documents_repo
from app.repositories.bills import bill_comparisons_repo
from app.utils.security import get_session_id

router = APIRouter(prefix="/bills", tags=["Bills"])


@router.post("/compare", response_model=BillComparisonResponse)
async def compare_bills(
    body: BillComparisonRequest,
    x_session_id: Optional[str] = Header(None),
):
    session_id = get_session_id(x_session_id)

    # Verify ownership of both documents
    curr_doc = await documents_repo.get_document(body.current_document_id, session_id)
    if not curr_doc:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Current bill not found or unauthorized.", "retryable": False},
        )

    prev_doc = await documents_repo.get_document(body.previous_document_id, session_id)
    if not prev_doc:
        raise HTTPException(
            status_code=404,
            detail={"code": "NOT_FOUND", "message": "Previous bill not found or unauthorized.", "retryable": False},
        )

    comparison = comparison_service.compare_bills(
        current_doc=curr_doc,
        previous_doc=prev_doc,
        language=body.language,
    )

    # Persist comparison record
    comp_dict = comparison.model_dump()
    comp_dict["owner_id"] = session_id
    await bill_comparisons_repo.insert_comparison(comp_dict)

    return comparison
