"""Security, session token generation, and credential/PII masking utilities."""
from __future__ import annotations
import re
import secrets
from typing import Optional


def generate_session_id() -> str:
    """Generate a cryptographically secure anonymous session identifier."""
    return f"sess_{secrets.token_urlsafe(24)}"


def mask_identifier(ident: Optional[str]) -> str:
    """
    Mask a consumer number, phone number, or account ID,
    keeping only the last 4 characters visible.
    """
    if not ident:
        return ""
    clean = str(ident).strip()
    if len(clean) <= 4:
        return "****"
    return f"****{clean[-4:]}"


def sanitize_log_text(text: str) -> str:
    """Strip or mask potentially sensitive info before writing to logs."""
    if not text:
        return text
    # Mask email patterns
    text = re.sub(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", "[EMAIL_REDACTED]", text)
    # Mask 10-12 digit account/phone numbers
    text = re.sub(r"\b\d{10,12}\b", "[ACCOUNT_REDACTED]", text)
    return text


def get_session_id(x_session_id: Optional[str] = None) -> str:
    """Extract or generate a validated session ID."""
    if x_session_id and len(x_session_id) >= 8 and len(x_session_id) <= 128:
        return x_session_id
    return generate_session_id()
