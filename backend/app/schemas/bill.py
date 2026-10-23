"""Schemas for Bill extraction, comparison, and deterministic arithmetic."""
from __future__ import annotations
from typing import Optional, List, Any
from pydantic import BaseModel, Field
from app.schemas.common import AppLanguage, ExtractionStatus


class BillField(BaseModel):
    value: Optional[Any] = None
    currency: Optional[str] = None
    unit: Optional[str] = None
    source_text: str = ""
    status: ExtractionStatus = ExtractionStatus.MEDIUM


class LineItem(BaseModel):
    label: str
    amount: float
    source_text: str = ""
    status: ExtractionStatus = ExtractionStatus.MEDIUM


class BillExtractionSchema(BaseModel):
    document_type: str = "electricity_bill"
    provider_name: Optional[BillField] = None
    consumer_identifier_masked: Optional[BillField] = None
    billing_period_start: Optional[BillField] = None
    billing_period_end: Optional[BillField] = None
    issue_date: Optional[BillField] = None
    due_date: Optional[BillField] = None
    amount_due: Optional[BillField] = None
    consumption: Optional[BillField] = None
    line_items: List[LineItem] = Field(default_factory=list)
    summary: Optional[str] = None
    warnings: List[str] = Field(default_factory=list)


class BillComparisonRequest(BaseModel):
    current_document_id: str
    previous_document_id: str
    language: AppLanguage = AppLanguage.EN


class AmountComparison(BaseModel):
    previous: Optional[float] = None
    current: Optional[float] = None
    difference: Optional[float] = None
    percentage_change: Optional[float] = None
    status: str = "uncertain"  # increased, decreased, unchanged, uncertain
    currency: str = "INR"


class ConsumptionComparison(BaseModel):
    previous: Optional[float] = None
    current: Optional[float] = None
    difference: Optional[float] = None
    unit: Optional[str] = None
    status: str = "not_comparable"  # increased, decreased, unchanged, not_comparable
    comparable: bool = False
    warnings: List[str] = Field(default_factory=list)


class DueDateComparison(BaseModel):
    previous: Optional[str] = None
    current: Optional[str] = None
    status: str = "uncertain"  # changed, same, uncertain


class LineItemDiff(BaseModel):
    label: str
    current_amount: Optional[float] = None
    previous_amount: Optional[float] = None
    status: str = "same"  # added, removed, changed, same


class BillComparisonResponse(BaseModel):
    comparison_id: str
    current_document_id: str
    previous_document_id: str
    amount: AmountComparison
    consumption: ConsumptionComparison
    due_date: DueDateComparison
    line_item_diffs: List[LineItemDiff] = Field(default_factory=list)
    interpretation: str
    warnings: List[str] = Field(default_factory=list)
    created_at: str
