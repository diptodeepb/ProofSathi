"""Speech API endpoint for ElevenLabs Text-to-Speech synthesis."""
from __future__ import annotations
from fastapi import APIRouter, Response

from app.schemas.speech import SpeechRequest
from app.services.elevenlabs_service import elevenlabs_service

router = APIRouter(prefix="/speech", tags=["Speech"])


@router.post("", response_class=Response)
async def generate_speech(body: SpeechRequest):
    """
    Synthesize speech for a verified document summary.
    Returns audio/mpeg bytes.
    """
    audio_bytes = await elevenlabs_service.synthesize(
        text=body.text,
        language=body.language.value,
    )
    return Response(
        content=audio_bytes,
        media_type="audio/mpeg",
        headers={
            "Cache-Control": "private, max-age=3600",
            "Content-Disposition": "inline; filename=explanation.mp3",
        },
    )
