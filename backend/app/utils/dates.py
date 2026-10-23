"""Date parsing, normalization, and ambiguity detection utilities."""
from __future__ import annotations
import re
from datetime import datetime
from typing import Optional, Tuple


DATE_PATTERNS = [
    # YYYY-MM-DD
    (r"^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$", "YMD"),
    # DD-MM-YYYY or DD/MM/YYYY
    (r"^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$", "DMY_or_MDY"),
    # DD Mon YYYY or DD Month YYYY (e.g. 12 Nov 2026, 12 November 2026)
    (r"^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$", "TEXT_DMY"),
    # Month DD, YYYY
    (r"^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})$", "TEXT_MDY"),
]

MONTH_NAMES = {
    "jan": 1, "january": 1,
    "feb": 2, "february": 2,
    "mar": 3, "march": 3,
    "apr": 4, "april": 4,
    "may": 5,
    "jun": 6, "june": 6,
    "jul": 7, "july": 7,
    "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9,
    "oct": 10, "october": 10,
    "nov": 11, "november": 11,
    "dec": 12, "december": 12,
}


def parse_and_normalize_date(date_str: str) -> Tuple[Optional[str], bool, str]:
    """
    Parse a date string and normalize to YYYY-MM-DD.
    Returns:
        (normalized_date_str, is_ambiguous, reason)
    """
    if not date_str or not isinstance(date_str, str):
        return None, False, "Empty or invalid input"

    cleaned = date_str.strip().replace(",", " ")
    cleaned = re.sub(r"\s+", " ", cleaned)

    # 1. YYYY-MM-DD
    m_ymd = re.match(r"^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$", cleaned)
    if m_ymd:
        year, month, day = int(m_ymd.group(1)), int(m_ymd.group(2)), int(m_ymd.group(3))
        try:
            dt = datetime(year, month, day)
            return dt.strftime("%Y-%m-%d"), False, "Clear ISO format"
        except ValueError:
            return None, False, "Invalid calendar date"

    # 2. Text month: DD Mon YYYY
    m_text_dmy = re.match(r"^(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})$", cleaned)
    if m_text_dmy:
        day = int(m_text_dmy.group(1))
        mon_str = m_text_dmy.group(2).lower()
        year = int(m_text_dmy.group(3))
        if mon_str in MONTH_NAMES:
            month = MONTH_NAMES[mon_str]
            try:
                dt = datetime(year, month, day)
                return dt.strftime("%Y-%m-%d"), False, "Clear textual month"
            except ValueError:
                return None, False, "Invalid calendar date"

    # 3. Text month: Month DD, YYYY
    m_text_mdy = re.match(r"^([A-Za-z]+)\s+(\d{1,2})\s+(\d{4})$", cleaned)
    if m_text_mdy:
        mon_str = m_text_mdy.group(1).lower()
        day = int(m_text_mdy.group(2))
        year = int(m_text_mdy.group(3))
        if mon_str in MONTH_NAMES:
            month = MONTH_NAMES[mon_str]
            try:
                dt = datetime(year, month, day)
                return dt.strftime("%Y-%m-%d"), False, "Clear textual month"
            except ValueError:
                return None, False, "Invalid calendar date"

    # 4. Numeric DD-MM-YYYY vs MM-DD-YYYY
    m_num = re.match(r"^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$", cleaned)
    if m_num:
        p1, p2, year = int(m_num.group(1)), int(m_num.group(2)), int(m_num.group(3))
        # In India, DD/MM/YYYY is standard.
        # But if p1 <= 12 and p2 <= 12 and p1 != p2, it is inherently ambiguous between DD/MM and MM/DD.
        if p1 <= 12 and p2 <= 12 and p1 != p2:
            # We normalize assuming DD/MM/YYYY (Indian standard), but flag ambiguity!
            try:
                dt = datetime(year, p2, p1)
                return (
                    dt.strftime("%Y-%m-%d"),
                    True,
                    f"Ambiguous day/month ordering between {p1}/{p2} and {p2}/{p1}",
                )
            except ValueError:
                pass
        elif p1 > 12:
            # Must be DD/MM/YYYY
            try:
                dt = datetime(year, p2, p1)
                return dt.strftime("%Y-%m-%d"), False, "Unambiguous DD/MM/YYYY"
            except ValueError:
                return None, False, "Invalid calendar date"
        elif p2 > 12:
            # Must be MM/DD/YYYY
            try:
                dt = datetime(year, p1, p2)
                return dt.strftime("%Y-%m-%d"), False, "Unambiguous MM/DD/YYYY"
            except ValueError:
                return None, False, "Invalid calendar date"
        elif p1 == p2:
            # Same day and month
            try:
                dt = datetime(year, p1, p2)
                return dt.strftime("%Y-%m-%d"), False, "Identical day and month"
            except ValueError:
                return None, False, "Invalid calendar date"

    return None, True, "Could not reliably parse date"


def calculate_period_days(start_date: str, end_date: str) -> Optional[int]:
    """Calculate the number of days between two YYYY-MM-DD dates."""
    try:
        d1 = datetime.strptime(start_date, "%Y-%m-%d")
        d2 = datetime.strptime(end_date, "%Y-%m-%d")
        delta = (d2 - d1).days
        return delta if delta >= 0 else None
    except Exception:
        return None
