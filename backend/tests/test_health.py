"""Test health check endpoint."""
import pytest
from tests.conftest import get_client


@pytest.mark.asyncio
async def test_health_check():
    async with get_client() as client:
        res = await client.get("/api/v1/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "ok"
        assert data["service"] == "proofsathi-api"
        assert "version" in data
