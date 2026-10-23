"""Deterministic numeric and monetary calculation utilities using Decimal."""
from __future__ import annotations
import re
from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
from typing import Optional, Tuple, Any


def clean_numeric_string(val: Any) -> Optional[float]:
    """Extract and parse a numeric float/decimal from dirty strings (e.g. '₹ 1,240.50/-')."""
    if val is None:
        return None
    if isinstance(val, (int, float)):
        return float(val)
    if isinstance(val, Decimal):
        return float(val)

    s = str(val).strip()
    # Strip currency symbols and common trailers
    s = s.replace("₹", "").replace("Rs.", "").replace("Rs", "").replace("/-", "")
    # Remove commas
    s = s.replace(",", "")
    # Extract floating number pattern
    match = re.search(r"[-+]?\d*\.?\d+", s)
    if match:
        try:
            return float(match.group(0))
        except ValueError:
            return None
    return None


def to_decimal(val: Any) -> Optional[Decimal]:
    """Convert value to Decimal safely."""
    if val is None:
        return None
    if isinstance(val, Decimal):
        return val
    try:
        cleaned = clean_numeric_string(val)
        if cleaned is None:
            return None
        return Decimal(str(cleaned)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
    except (InvalidOperation, TypeError, ValueError):
        return None


def calculate_amount_difference(
    current: Optional[Decimal], previous: Optional[Decimal]
) -> Tuple[Optional[Decimal], Optional[Decimal], str]:
    """
    Deterministically calculate amount difference and percentage change.
    Returns:
        (difference, percentage_change, status)
        where status is 'increased', 'decreased', 'unchanged', or 'uncertain'
    """
    if current is None or previous is None:
        return None, None, "uncertain"

    diff = current - previous

    if diff > Decimal("0.00"):
        status = "increased"
    elif diff < Decimal("0.00"):
        status = "decreased"
    else:
        status = "unchanged"

    # Percentage change is only defined when previous > 0
    if previous > Decimal("0.00"):
        pct = ((diff / previous) * Decimal("100")).quantize(
            Decimal("0.01"), rounding=ROUND_HALF_UP
        )
    else:
        pct = None

    return diff, pct, status


def normalize_currency(curr_raw: Optional[str]) -> str:
    """Standardize currency notation."""
    if not curr_raw:
        return "INR"
    upper = curr_raw.upper().strip()
    if upper in ("RS", "RS.", "INR", "RUPEES", "₹", "TAKA", "TK"):
        return "INR"
    return upper


def normalize_consumption_unit(unit_raw: Optional[str]) -> Optional[str]:
    """Standardize consumption units (kWh, units, kL, etc.)."""
    if not unit_raw:
        return None
    u = unit_raw.lower().strip()
    if u in ("kwh", "units", "unit", "kilowatt-hour", "k.w.h.", "k.w.h"):
        return "kWh"
    if u in ("kl", "kilolitre", "kilolitres", "litres", "l"):
        return "kL"
    if u in ("scm", "cubic meters", "m3"):
        return "SCM"
    return unit_raw.strip()
