"""Schemas for simulated payment gateway transactions and receipts."""
from __future__ import annotations
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class PaymentBreakdownItem(BaseModel):
    label: str
    amount: float
    formatted_amount: Optional[str] = None


class SimulatePaymentRequest(BaseModel):
    document_id: str
    amount: float
    currency: str = "INR"
    biller_name: str
    consumer_id: str
    consumer_name: Optional[str] = "Senior Citizen Beneficiary"
    payment_method: str = "upi"
    due_date: Optional[str] = None
    period_or_description: Optional[str] = None
    breakdown_items: Optional[List[PaymentBreakdownItem]] = None


class PaymentReceiptResponse(BaseModel):
    payment_id: str
    transaction_id: str
    biller_reference: str
    document_id: str
    amount: float
    currency: str = "INR"
    biller_name: str
    consumer_id: str
    consumer_name: str
    payment_method: str
    status: str = "success"
    paid_at: str
    due_date: Optional[str] = None
    period_or_description: Optional[str] = None
    gateway_note: str = "Authorized by Bharat BillPay (BBPS) Simulation Switch"
