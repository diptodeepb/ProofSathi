"""Common enums, base types, and standard error responses."""
from __future__ import annotations
from enum import Enum
from typing import Optional, List, Any
from pydantic import BaseModel, Field


class AppLanguage(str, Enum):
    EN = "en"
    HI = "hi"
    BN = "bn"


class WorkflowType(str, Enum):
    BILL = "bill"
    DOCUMENT = "document"


class DocumentType(str, Enum):
    ELECTRICITY_BILL = "electricity_bill"
    WATER_BILL = "water_bill"
    GAS_BILL = "gas_bill"
    TELECOM_BILL = "telecom_bill"
    PENSION_NOTICE = "pension_notice"
    BANK_NOTICE = "bank_notice"
    HOSPITAL_DOCUMENT = "hospital_document"
    GOVERNMENT_NOTICE = "government_notice"
    OTHER = "other"
    UNKNOWN = "unknown"


class ExtractionStatus(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"


class ActionStatus(str, Enum):
    PENDING = "pending"
    COMPLETED = "completed"
    NEEDS_CONFIRMATION = "needs_confirmation"


class ErrorDetail(BaseModel):
    code: str
    message: str
    retryable: bool = False
    details: Optional[Any] = None


class ErrorResponse(BaseModel):
    error: ErrorDetail
