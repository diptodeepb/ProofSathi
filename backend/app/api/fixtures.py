"""Demo fixtures API endpoints for test runs and evaluator walkthroughs."""
from __future__ import annotations
from fastapi import APIRouter, Response, HTTPException
from app.fixtures_generator import FIXTURE_DEFINITIONS, get_fixture_image_bytes, ensure_fixtures_generated

router = APIRouter(prefix="/demo/fixtures", tags=["Demo Fixtures"])


@router.get("")
async def list_fixtures():
    """List all available synthetic test fixtures."""
    ensure_fixtures_generated()
    fixtures = []
    for fid, defn in FIXTURE_DEFINITIONS.items():
        fixtures.append({
            "id": fid,
            "title": defn["title"],
            "workflow": defn["workflow"],
            "document_type": defn["document_type"],
            "description": defn["description"],
            "image_url": f"/api/v1/demo/fixtures/{fid}/image",
            "is_blurry": defn["is_blurry"],
        })
    return {"fixtures": fixtures}


@router.get("/{fixture_id}/image", response_class=Response)
async def get_fixture_image(fixture_id: str):
    """Serve synthetic fixture document JPEG image."""
    img_bytes = get_fixture_image_bytes(fixture_id)
    if not img_bytes:
        raise HTTPException(status_code=404, detail="Fixture not found.")
    return Response(
        content=img_bytes,
        media_type="image/jpeg",
        headers={"Cache-Control": "public, max-age=86400"},
    )
