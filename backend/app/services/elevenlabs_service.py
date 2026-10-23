"""ElevenLabs Text-to-Speech integration with memory caching and error handling."""
from __future__ import annotations
import hashlib
import logging
from typing import Dict
import httpx
from fastapi import HTTPException

from app.config import settings

logger = logging.getLogger("proofsathi.speech")

# In-memory bounded cache for generated audio bytes: sha256 -> bytes
_AUDIO_CACHE: Dict[str, bytes] = {}
MAX_CACHE_ENTRIES = 50

# Minimal valid MP3 frame (1 frame of silence / sync) for offline mock testing
MINIMAL_SILENT_MP3 = (
    b"\xff\xfb\x90d\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
    b"\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
    b"\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
)


class ElevenLabsService:
    @staticmethod
    def _get_cache_key(lang: str, voice_id: str, text: str) -> str:
        clean = " ".join(text.strip().split())
        raw = f"{lang}:{voice_id}:{settings.elevenlabs_model_id}:{clean}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    @staticmethod
    async def synthesize(text: str, language: str) -> bytes:
        """
        Synthesize text to speech using ElevenLabs API with caching.
        """
        if not text or not text.strip():
            raise HTTPException(
                status_code=400,
                detail={"code": "VALIDATION_ERROR", "message": "Speech text cannot be empty.", "retryable": False},
            )

        if len(text) > 1800:
            raise HTTPException(
                status_code=400,
                detail={
                    "code": "VALIDATION_ERROR",
                    "message": "Speech text exceeds maximum length of 1,800 characters.",
                    "retryable": False,
                },
            )

        voice_id = settings.get_voice_id(language)
        cache_key = ElevenLabsService._get_cache_key(language, voice_id, text)

        # Check in-memory cache
        if cache_key in _AUDIO_CACHE:
            return _AUDIO_CACHE[cache_key]

        # Check if API key is provided
        if not settings.elevenlabs_api_key or not settings.elevenlabs_api_key.strip():
            logger.info("ELEVENLABS_API_KEY is not configured; returning mock audio frame for demo.")
            return MINIMAL_SILENT_MP3

        url = f"https://api.elevenlabs.io/v1/text-to-speech/{voice_id}"
        headers = {
            "xi-api-key": settings.elevenlabs_api_key,
            "Content-Type": "application/json",
            "Accept": "audio/mpeg",
        }
        payload = {
            "text": text,
            "model_id": settings.elevenlabs_model_id,
            "voice_settings": {
                "stability": 0.5,
                "similarity_boost": 0.75,
            },
        }

        try:
            async with httpx.AsyncClient(timeout=25.0) as client:
                res = await client.post(url, headers=headers, json=payload)

            if res.status_code == 429:
                logger.warning("ElevenLabs rate limit 429 encountered.")
                raise HTTPException(
                    status_code=429,
                    detail={
                        "code": "TTS_RATE_LIMIT",
                        "message": "Voice service is currently busy. Please try again in a moment.",
                        "retryable": True,
                    },
                )

            if res.is_error:
                logger.error(f"ElevenLabs TTS returned error status {res.status_code}: {res.text}")
                raise HTTPException(
                    status_code=502,
                    detail={
                        "code": "TTS_UNAVAILABLE",
                        "message": "Could not generate speech right now. The text explanation remains visible.",
                        "retryable": True,
                    },
                )

            audio_bytes = res.content
            # Save to bounded cache
            if len(_AUDIO_CACHE) >= MAX_CACHE_ENTRIES:
                _AUDIO_CACHE.pop(next(iter(_AUDIO_CACHE)))
            _AUDIO_CACHE[cache_key] = audio_bytes

            return audio_bytes

        except httpx.TimeoutException:
            raise HTTPException(
                status_code=504,
                detail={
                    "code": "TTS_UNAVAILABLE",
                    "message": "Voice service timed out. Please try again.",
                    "retryable": True,
                },
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Unexpected error calling ElevenLabs TTS: {e}")
            raise HTTPException(
                status_code=502,
                detail={
                    "code": "TTS_UNAVAILABLE",
                    "message": "Speech generation encountered a network error.",
                    "retryable": True,
                },
            )


elevenlabs_service = ElevenLabsService()
