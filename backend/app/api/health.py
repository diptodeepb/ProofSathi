"""Health check endpoint."""
from __future__ import annotations
from fastapi import APIRouter

router = APIRouter(tags=["Health"])


@router.get("/health")
async def health_check():
    """Service health status."""
    return {
        "status": "ok",
        "service": "proofsathi-api",
        "version": "0.1.0",
    }
