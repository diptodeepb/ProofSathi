"""Payments API endpoints for simulated elder-friendly bill and document checkout."""
from __future__ import annotations
import uuid
import random
from datetime import datetime, timezone
from typing import Optional, List
from fastapi import APIRouter, Header, HTTPException

from app.schemas.payment import SimulatePaymentRequest, PaymentReceiptResponse
from app.repositories.mongo import db_manager
from app.repositories.documents import documents_repo
from app.repositories.actions import actions_repo
from app.utils.security import get_session_id

router = APIRouter(prefix="/payments", tags=["Payments"])


def _payments_col():
    return db_manager.get_collection("payments")


@router.post("/simulate", response_model=PaymentReceiptResponse)
async def simulate_payment(
    body: SimulatePaymentRequest,
    x_session_id: Optional[str] = Header(None),
):
    session_id = get_session_id(x_session_id)
    payment_id = f"pay_{uuid.uuid4().hex[:12]}"
    txn_random = "".join([str(random.randint(0, 9)) for _ in range(8)])
    transaction_id = f"BBPS-2026-TXN-{txn_random}"
    ref_random = "".join([str(random.randint(0, 9)) for _ in range(6)])
    biller_reference = f"REF-{ref_random}"
    now_iso = datetime.now(timezone.utc).isoformat()

    payment_record = {
        "id": payment_id,
        "_id": payment_id,
        "owner_id": session_id,
        "document_id": body.document_id,
        "transaction_id": transaction_id,
        "biller_reference": biller_reference,
        "amount": body.amount,
        "currency": body.currency,
        "biller_name": body.biller_name,
        "consumer_id": body.consumer_id,
        "consumer_name": body.consumer_name or "Senior Citizen Beneficiary",
        "payment_method": body.payment_method,
        "status": "success",
        "paid_at": now_iso,
        "due_date": body.due_date,
        "period_or_description": body.period_or_description,
        "created_at": now_iso,
    }

    # Store in payments collection
    await _payments_col().insert_one(payment_record)

    # Update document record if exists
    doc = await documents_repo.get_document(body.document_id, session_id)
    if doc:
        collection = db_manager.get_collection("documents")
        await collection.update_one(
            {"_id": body.document_id, "owner_id": session_id},
            {
                "$set": {
                    "payment_status": "paid",
                    "payment_id": payment_id,
                    "payment_transaction_id": transaction_id,
                    "paid_at": now_iso,
                    "paid_amount": body.amount,
                }
            },
        )

    # If document has pending actions relating to payment/bill/certificate, mark them completed
    try:
        actions = await actions_repo.list_actions(session_id, document_id=body.document_id)
        for act in actions:
            title_lower = (act.get("title") or "").lower()
            if any(term in title_lower for term in ("pay", "bill", "certificate", "fee", "appointment", "verification")):
                await actions_repo.update_action(
                    act.get("id") or act.get("_id"),
                    session_id,
                    {"status": "completed"},
                )
    except Exception:
        pass

    return PaymentReceiptResponse(
        payment_id=payment_id,
        transaction_id=transaction_id,
        biller_reference=biller_reference,
        document_id=body.document_id,
        amount=body.amount,
        currency=body.currency,
        biller_name=body.biller_name,
        consumer_id=body.consumer_id,
        consumer_name=body.consumer_name or "Senior Citizen Beneficiary",
        payment_method=body.payment_method,
        status="success",
        paid_at=now_iso,
        due_date=body.due_date,
        period_or_description=body.period_or_description,
    )


@router.get("/{document_id}", response_model=Optional[PaymentReceiptResponse])
async def get_payment_receipt(
    document_id: str,
    x_session_id: Optional[str] = Header(None),
):
    session_id = get_session_id(x_session_id)
    rec = await _payments_col().find_one({"document_id": document_id, "owner_id": session_id})
    if not rec:
        return None

    return PaymentReceiptResponse(
        payment_id=rec.get("id") or rec.get("_id"),
        transaction_id=rec.get("transaction_id"),
        biller_reference=rec.get("biller_reference"),
        document_id=rec.get("document_id"),
        amount=float(rec.get("amount", 0.0)),
        currency=rec.get("currency", "INR"),
        biller_name=rec.get("biller_name", ""),
        consumer_id=rec.get("consumer_id", ""),
        consumer_name=rec.get("consumer_name", "Senior Citizen Beneficiary"),
        payment_method=rec.get("payment_method", "upi"),
        status=rec.get("status", "success"),
        paid_at=rec.get("paid_at", ""),
        due_date=rec.get("due_date"),
        period_or_description=rec.get("period_or_description"),
    )
