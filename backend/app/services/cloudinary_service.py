"""Cloudinary authenticated image storage management service."""
from __future__ import annotations
import logging
import uuid
from typing import Optional, Dict, Any
import cloudinary
import cloudinary.uploader
import cloudinary.utils

from app.config import settings

logger = logging.getLogger("proofsathi.cloudinary")


class CloudinaryService:
    def __init__(self):
        self._configured = False
        if (
            settings.cloudinary_cloud_name
            and settings.cloudinary_api_key
            and settings.cloudinary_api_secret
        ):
            try:
                cloudinary.config(
                    cloud_name=settings.cloudinary_cloud_name,
                    api_key=settings.cloudinary_api_key,
                    api_secret=settings.cloudinary_api_secret,
                    secure=True,
                )
                self._configured = True
            except Exception as e:
                logger.warning(f"Could not initialize Cloudinary: {e}")

    @property
    def is_configured(self) -> bool:
        return self._configured

    def upload_private_document(self, image_bytes: bytes, mime_type: str) -> Optional[Dict[str, Any]]:
        """
        Upload document scan using authenticated delivery type with random public ID.
        Never exposes credentials to the frontend.
        """
        if not self._configured:
            return None

        # Random opaque public ID without PII
        public_id = f"doc_{uuid.uuid4().hex}"
        folder = settings.cloudinary_document_folder

        try:
            res = cloudinary.uploader.upload(
                image_bytes,
                folder=folder,
                public_id=public_id,
                type=settings.cloudinary_document_delivery_type,  # "authenticated"
                resource_type="image",
                overwrite=True,
                invalidate=True,
            )
            return {
                "asset_id": res.get("asset_id"),
                "public_id": res.get("public_id"),
                "resource_type": "image",
                "delivery_type": settings.cloudinary_document_delivery_type,
            }
        except Exception as e:
            logger.error(f"Cloudinary upload failed: {e}")
            return None

    def delete_document(self, public_id: Optional[str]) -> bool:
        """Best effort deletion of temporary document scan."""
        if not self._configured or not public_id:
            return False

        try:
            cloudinary.uploader.destroy(
                public_id,
                type=settings.cloudinary_document_delivery_type,
                resource_type="image",
                invalidate=True,
            )
            return True
        except Exception as e:
            logger.warning(f"Cloudinary asset cleanup error for {public_id}: {e}")
            return False

    def generate_signed_view_url(self, public_id: str, expiry_seconds: int = 300) -> Optional[str]:
        """Generate short-lived signed URL for an authorized document preview."""
        if not self._configured or not public_id:
            return None

        try:
            url, _ = cloudinary.utils.cloudinary_url(
                public_id,
                type=settings.cloudinary_document_delivery_type,
                sign_url=True,
                secure=True,
            )
            return url
        except Exception as e:
            logger.error(f"Failed to generate signed Cloudinary URL: {e}")
            return None


cloudinary_service = CloudinaryService()
