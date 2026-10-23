"""Test speech endpoint validation and synthesis."""
import pytest
from tests.conftest import get_client


@pytest.mark.asyncio
async def test_speech_empty_text_rejected():
    async with get_client() as client:
        res = await client.post("/api/v1/speech", json={"text": "", "language": "en"})
        assert res.status_code == 422 or res.status_code == 400


@pytest.mark.asyncio
async def test_speech_oversized_text_rejected():
    async with get_client() as client:
        long_text = "Word " * 500  # > 1800 chars
        res = await client.post("/api/v1/speech", json={"text": long_text, "language": "en"})
        assert res.status_code == 422 or res.status_code == 400


@pytest.mark.asyncio
async def test_speech_synthesis_returns_audio():
    async with get_client() as client:
        res = await client.post(
            "/api/v1/speech",
            json={"text": "Your electricity bill amount due is twelve hundred forty rupees.", "language": "en"},
        )
        assert res.status_code == 200
        assert res.headers["content-type"].startswith("audio/mpeg")
        assert len(res.content) > 0
