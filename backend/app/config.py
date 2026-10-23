"""Application configuration for ProofSathi using pydantic-settings."""
from __future__ import annotations
import os
from typing import List, Optional
from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # App
    app_env: str = "development"
    app_name: str = "ProofSathi"
    api_prefix: str = "/api/v1"
    frontend_origin: str = "http://localhost:5173"
    log_level: str = "INFO"

    # Gemini / Gemma
    gemini_api_key: str = ""
    gemma_model: str = "gemma-4-26b-a4b-it"
    gemma_max_output_tokens: int = 2500
    gemma_temperature: float = 0.2

    # MongoDB Atlas
    mongodb_uri: str = ""
    mongodb_database: str = "proofsathi"

    # Cloudinary
    cloudinary_cloud_name: str = ""
    cloudinary_api_key: str = ""
    cloudinary_api_secret: str = ""
    cloudinary_document_folder: str = "proofsathi/private-documents"
    cloudinary_static_folder: str = "proofsathi/public-assets"
    cloudinary_document_delivery_type: str = "authenticated"
    cloudinary_delete_temp_documents: bool = True

    # ElevenLabs
    elevenlabs_api_key: str = ""
    elevenlabs_model_id: str = "eleven_multilingual_v2"
    elevenlabs_voice_id_en: str = "21m00Tcm4TlvDq8ikWAM"
    elevenlabs_voice_id_hi: str = "yoZ06aMxZJJ28mfd3POQ"
    elevenlabs_voice_id_bn: str = "j5PhP1QJv2DvlhRv3mEv"

    # Google Cloud Translation (Optional)
    google_cloud_project: str = ""
    google_application_credentials: str = ""

    # Retention
    store_original_documents: bool = False
    document_retention_days: int = 0

    model_config = SettingsConfigDict(
        env_file=os.path.join(os.path.dirname(__file__), "..", ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @model_validator(mode="after")
    def resolve_backend_env_overrides(self) -> Settings:
        """
        Guarantee backend/.env values take top priority and are never erased
        by empty keys in parent environment files.
        """
        be_env_path = os.path.join(os.path.dirname(__file__), "..", ".env")
        if os.path.exists(be_env_path):
            try:
                with open(be_env_path, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line.startswith("#") or "=" not in line:
                            continue
                        k, v = line.split("=", 1)
                        k = k.strip().lower()
                        v = v.strip().strip('"').strip("'")
                        if not v:
                            continue
                        if k == "elevenlabs_api_key" and (not self.elevenlabs_api_key or not self.elevenlabs_api_key.strip()):
                            self.elevenlabs_api_key = v
                        elif k == "gemini_api_key" and (not self.gemini_api_key or not self.gemini_api_key.strip()):
                            self.gemini_api_key = v
                        elif k == "mongodb_uri" and (not self.mongodb_uri or not self.mongodb_uri.strip()):
                            self.mongodb_uri = v
            except Exception:
                pass
        return self

    @property
    def allowed_origins(self) -> List[str]:
        origins = [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:3000",
            "http://127.0.0.1:3000",
        ]
        if self.frontend_origin and self.frontend_origin not in origins:
            origins.append(self.frontend_origin)
        # Also allow vercel preview and production origins in production/preview
        return origins

    def get_voice_id(self, lang: str) -> str:
        lang_normalized = (lang or "en").lower().strip()
        if lang_normalized == "hi":
            return self.elevenlabs_voice_id_hi or self.elevenlabs_voice_id_en
        elif lang_normalized == "bn":
            return self.elevenlabs_voice_id_bn or self.elevenlabs_voice_id_en
        return self.elevenlabs_voice_id_en


settings = Settings()
