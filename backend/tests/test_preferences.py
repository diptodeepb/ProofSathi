"""Test preferences API."""
import pytest
from tests.conftest import get_client


@pytest.mark.asyncio
async def test_preferences_lifecycle():
    async with get_client() as client:
        headers = {"X-Session-ID": "test_pref_session_1"}

        # Default should be en
        get_res = await client.get("/api/v1/preferences", headers=headers)
        assert get_res.status_code == 200
        assert get_res.json()["language"] == "en"

        # Update to Bengali (bn)
        put_res = await client.put("/api/v1/preferences", json={"language": "bn"}, headers=headers)
        assert put_res.status_code == 200
        assert put_res.json()["language"] == "bn"

        # Fetch again
        verify_res = await client.get("/api/v1/preferences", headers=headers)
        assert verify_res.status_code == 200
        assert verify_res.json()["language"] == "bn"
