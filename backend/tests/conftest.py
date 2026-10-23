"""Pytest configuration and global setup for ProofSathi backend tests."""
import os
import sys
import pytest
from httpx import AsyncClient, ASGITransport

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.main import app


def get_client() -> AsyncClient:
    return AsyncClient(transport=ASGITransport(app=app), base_url="http://testserver")
