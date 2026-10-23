"""Bill service for post-processing and normalizing extracted bill data."""
from __future__ import annotations
from typing import List, Tuple
from app.schemas.common import ExtractionStatus
from app.schemas.document import DocumentField
from app.schemas.bill import BillExtractionSchema
from app.utils.dates import parse_and_normalize_date
from app.utils.numbers import (
    to_decimal,
    clean_numeric_string,
    normalize_currency,
    normalize_consumption_unit,
)
from app.utils.security import mask_identifier


def process_bill_extraction(extracted: BillExtractionSchema) -> Tuple[List[DocumentField], List[str]]:
    """
    Convert raw bill extraction schema into standardized DocumentField list
    with normalized values and arithmetic checks.
    """
    fields: List[DocumentField] = []
    warnings: List[str] = list(extracted.warnings)

    # 1. Amount Due
    if extracted.amount_due and extracted.amount_due.value is not None:
        amount_dec = to_decimal(extracted.amount_due.value)
        status = extracted.amount_due.status
        needs_conf = False
        if amount_dec is None:
            status = ExtractionStatus.LOW
            needs_conf = True
            warnings.append("The total amount payable could not be clearly verified from the image.")

        fields.append(
            DocumentField(
                key="amount_due",
                label="Amount Due",
                value=f"₹{amount_dec:,.2f}" if amount_dec is not None else str(extracted.amount_due.value),
                normalized_value=float(amount_dec) if amount_dec is not None else None,
                unit="INR",
                source_text=extracted.amount_due.source_text or "",
                extraction_status=status,
                needs_confirmation=needs_conf,
            )
        )
    else:
        warnings.append("No clear amount due found on this bill.")

    # 2. Due Date
    if extracted.due_date and extracted.due_date.value:
        norm_date, is_ambig, reason = parse_and_normalize_date(str(extracted.due_date.value))
        status = extracted.due_date.status
        needs_conf = False
        if is_ambig or not norm_date:
            status = ExtractionStatus.MEDIUM
            needs_conf = True
            warnings.append(f"Due date confirmation recommended: {reason}")

        fields.append(
            DocumentField(
                key="due_date",
                label="Due Date",
                value=norm_date or str(extracted.due_date.value),
                normalized_value=norm_date,
                unit=None,
                source_text=extracted.due_date.source_text or "",
                extraction_status=status,
                needs_confirmation=needs_conf,
            )
        )

    # 3. Billing Period
    p_start = extracted.billing_period_start.value if extracted.billing_period_start else None
    p_end = extracted.billing_period_end.value if extracted.billing_period_end else None
    if p_start or p_end:
        start_norm, _, _ = parse_and_normalize_date(str(p_start)) if p_start else (None, False, "")
        end_norm, _, _ = parse_and_normalize_date(str(p_end)) if p_end else (None, False, "")
        period_str = f"{start_norm or p_start or '?'} to {end_norm or p_end or '?'}"
        src_text = ""
        if extracted.billing_period_start and extracted.billing_period_start.source_text:
            src_text += extracted.billing_period_start.source_text + " "
        if extracted.billing_period_end and extracted.billing_period_end.source_text:
            src_text += extracted.billing_period_end.source_text

        fields.append(
            DocumentField(
                key="billing_period",
                label="Billing Period",
                value=period_str,
                normalized_value={"start": start_norm, "end": end_norm},
                unit=None,
                source_text=src_text.strip(),
                extraction_status=ExtractionStatus.HIGH if (start_norm and end_norm) else ExtractionStatus.MEDIUM,
                needs_confirmation=not bool(start_norm and end_norm),
            )
        )

    # 4. Units / Consumption
    if extracted.consumption and extracted.consumption.value is not None:
        c_val = clean_numeric_string(extracted.consumption.value)
        unit = normalize_consumption_unit(extracted.consumption.unit or "kWh")
        fields.append(
            DocumentField(
                key="consumption",
                label="Consumption",
                value=f"{c_val} {unit}" if c_val is not None else str(extracted.consumption.value),
                normalized_value=c_val,
                unit=unit,
                source_text=extracted.consumption.source_text or "",
                extraction_status=extracted.consumption.status,
                needs_confirmation=c_val is None,
            )
        )

    # 5. Provider Name
    if extracted.provider_name and extracted.provider_name.value:
        fields.append(
            DocumentField(
                key="provider_name",
                label="Utility Provider",
                value=str(extracted.provider_name.value),
                normalized_value=str(extracted.provider_name.value),
                source_text=extracted.provider_name.source_text or "",
                extraction_status=extracted.provider_name.status,
                needs_confirmation=False,
            )
        )

    # 6. Consumer Identifier (Masked for privacy)
    if extracted.consumer_identifier_masked and extracted.consumer_identifier_masked.value:
        masked = mask_identifier(str(extracted.consumer_identifier_masked.value))
        fields.append(
            DocumentField(
                key="consumer_id",
                label="Consumer ID",
                value=masked,
                normalized_value=masked,
                source_text=mask_identifier(extracted.consumer_identifier_masked.source_text),
                extraction_status=extracted.consumer_identifier_masked.status,
                needs_confirmation=False,
            )
        )

    # 7. Line Items (if present)
    if extracted.line_items:
        for idx, item in enumerate(extracted.line_items):
            item_amt = clean_numeric_string(item.amount)
            fields.append(
                DocumentField(
                    key=f"line_item_{idx}",
                    label=item.label,
                    value=f"₹{item_amt:,.2f}" if item_amt is not None else str(item.amount),
                    normalized_value=item_amt,
                    unit="INR",
                    source_text=item.source_text,
                    extraction_status=item.status,
                    needs_confirmation=item_amt is None,
                )
            )

    return fields, warnings
