"""ProofPath action items extraction, validation, and status lifecycle service."""
from __future__ import annotations
import uuid
from datetime import datetime, timezone
from typing import List, Tuple, Dict, Any, Optional

from app.schemas.common import ActionStatus, ExtractionStatus
from app.schemas.document import DocumentField
from app.schemas.action import (
    GeneralDocumentExtractionSchema,
    ActionItemCreate,
    ActionItemResponse,
    ActionItemUpdate,
)
from app.utils.dates import parse_and_normalize_date


def process_general_document_extraction(
    extracted: GeneralDocumentExtractionSchema, document_id: str
) -> Tuple[List[DocumentField], List[Dict[str, Any]], List[str]]:
    """
    Process general document extraction: map dates, required docs, and actions.
    """
    fields: List[DocumentField] = []
    actions: List[Dict[str, Any]] = []
    warnings: List[str] = list(extracted.uncertainties)

    # 1. Important Dates
    for idx, d in enumerate(extracted.important_dates):
        norm_date, is_ambig, reason = parse_and_normalize_date(d.date)
        status = d.status
        needs_conf = d.needs_confirmation or is_ambig
        if is_ambig:
            warnings.append(f"Date '{d.date}' needs confirmation: {reason}")

        fields.append(
            DocumentField(
                key=f"important_date_{idx}",
                label=d.meaning or "Important Date",
                value=norm_date or d.date,
                normalized_value=norm_date,
                source_text=d.source_text or "",
                extraction_status=status,
                needs_confirmation=needs_conf,
            )
        )

    # 2. Required Documents
    for idx, rd in enumerate(extracted.required_documents):
        fields.append(
            DocumentField(
                key=f"required_document_{idx}",
                label="Required Document",
                value=rd.name,
                normalized_value=rd.name,
                source_text=rd.source_text or "",
                extraction_status=rd.status,
                needs_confirmation=rd.needs_confirmation,
            )
        )

    # 3. Actions
    now_iso = datetime.now(timezone.utc).isoformat()
    for idx, a in enumerate(extracted.actions):
        due_norm, _, _ = parse_and_normalize_date(a.due_date) if a.due_date else (None, False, "")
        needs_conf = a.needs_confirmation
        # Rule: If no source text is provided, force needs_confirmation=True
        if not a.source_text or not a.source_text.strip():
            needs_conf = True

        action_obj = {
            "id": f"act_{uuid.uuid4().hex[:12]}",
            "document_id": document_id,
            "title": a.title,
            "description": a.description,
            "due_date": due_norm or a.due_date,
            "status": a.status.value if hasattr(a.status, "value") else str(a.status),
            "source_text": a.source_text or "",
            "needs_confirmation": needs_conf,
            "created_at": now_iso,
            "updated_at": now_iso,
        }
        actions.append(action_obj)

    return fields, actions, warnings
