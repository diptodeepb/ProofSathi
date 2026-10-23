"""Tests for Gemma AI multimodal integration via Gemini API key."""
from unittest.mock import AsyncMock, MagicMock
import pytest

from app.schemas.common import AppLanguage
from app.services.gemma_service import (
    GemmaService,
    get_genai_client,
)
from app.config import settings


@pytest.mark.asyncio
async def test_gemma_missing_api_key_fallback(monkeypatch):
    """When GEMINI_API_KEY is unset, GemmaService should return high-fidelity fallback."""
    monkeypatch.setattr(settings, "gemini_api_key", "")
    service = GemmaService()

    fake_bytes = b"\xff\xd8\xff\xe0" + b"\x00" * 200
    res = await service.extract_bill(fake_bytes, "image/jpeg", AppLanguage.EN)
    assert res.document_type == "electricity_bill"
    assert res.amount_due.value == 1240.0
    assert "₹1,240.00" in res.amount_due.source_text

    doc_res = await service.extract_general_document(fake_bytes, "image/jpeg", AppLanguage.BN)
    assert doc_res.document_type == "pension_notice"
    assert "পেনশন" in doc_res.summary


def test_clean_and_parse_json():
    service = GemmaService()
    # Code block format
    raw_md = "```json\n{\"document_type\": \"electricity_bill\", \"amount_due\": {\"value\": 999.0}}\n```"
    parsed = service._clean_and_parse_json(raw_md)
    assert parsed is not None
    assert parsed["document_type"] == "electricity_bill"
    assert parsed["amount_due"]["value"] == 999.0

    # Bare json
    bare = "{\"title\": \"Pension Notice\", \"actions\": []}"
    parsed_bare = service._clean_and_parse_json(bare)
    assert parsed_bare["title"] == "Pension Notice"

    # Malformed json that needs repair
    malformed = "{\"title\": 'Pension Notice', 'unclosed': true"
    parsed_repaired = service._clean_and_parse_json(malformed)
    assert parsed_repaired is not None
    assert parsed_repaired.get("unclosed") is True


@pytest.mark.asyncio
async def test_gemma_mocked_genai_call(monkeypatch):
    """Simulate google-genai async response with thinking parts ignored."""
    mock_thought_part = MagicMock()
    mock_thought_part.thought = True
    mock_thought_part.text = "Internal CoT thinking that should be ignored"

    mock_text_part = MagicMock()
    mock_text_part.thought = False
    mock_text_part.text = """
    {
        "document_type": "water_bill",
        "provider_name": {"value": "Municipal Water Supply", "source_text": "MWS", "status": "high"},
        "consumer_identifier_masked": {"value": "****1111", "source_text": "Consumer: 1111", "status": "high"},
        "amount_due": {"value": 450.0, "currency": "INR", "source_text": "Due: ₹450", "status": "high"},
        "due_date": {"value": "2026-11-20", "source_text": "20/11/2026", "status": "high"},
        "summary": "Water bill of ₹450 due on 20 Nov 2026",
        "line_items": []
    }
    """

    mock_candidate = MagicMock()
    mock_candidate.content.parts = [mock_thought_part, mock_text_part]

    mock_response = MagicMock()
    mock_response.candidates = [mock_candidate]
    mock_response.text = mock_text_part.text

    mock_client = MagicMock()
    mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

    monkeypatch.setattr("app.services.gemma_service.get_genai_client", lambda: mock_client)
    monkeypatch.setattr(settings, "gemini_api_key", "mock_key_123")

    service = GemmaService()
    fake_bytes = b"\xff\xd8\xff\xe0" + b"\x00" * 200
    res = await service.extract_bill(fake_bytes, "image/jpeg", AppLanguage.EN)

    assert res.document_type == "water_bill"
    assert res.amount_due.value == 450.0
    assert res.provider_name.value == "Municipal Water Supply"
    assert "Water bill of ₹450" in res.summary
