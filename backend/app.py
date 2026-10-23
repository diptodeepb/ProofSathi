"""FastAPI entrypoint alias for Vercel and WSGI/ASGI runners."""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app  # noqa: E402

__all__ = ["app"]
