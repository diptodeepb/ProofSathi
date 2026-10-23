"""Image validation, sanitization, EXIF stripping, and normalization service."""
from __future__ import annotations
import io
from typing import Tuple
from PIL import Image, ImageOps, ImageFile
from fastapi import HTTPException

# Prevent decompression bomb DOS attacks
Image.MAX_IMAGE_PIXELS = 64_000_000
ImageFile.LOAD_TRUNCATED_IMAGES = False

# Maximum allowed limits
MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB
MAX_DIMENSION_PX = 8000
MIN_DIMENSION_PX = 50  # Prevent trivial 1x1 noise images


def validate_and_normalize_image(raw_bytes: bytes, original_filename: str = "") -> Tuple[bytes, str, int, int]:
    """
    Validate, sanitize, orient, and normalize uploaded image bytes.

    Returns:
        (normalized_bytes, mime_type, width, height)
    Raises:
        HTTPException with clean error code.
    """
    # 1. Size check
    if not raw_bytes or len(raw_bytes) == 0:
        raise HTTPException(
            status_code=400,
            detail={"code": "INVALID_FILE_TYPE", "message": "Uploaded file is empty.", "retryable": True},
        )

    if len(raw_bytes) > MAX_FILE_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail={
                "code": "FILE_TOO_LARGE",
                "message": f"File size exceeds maximum allowed limit of {MAX_FILE_SIZE_BYTES // (1024*1024)} MB.",
                "retryable": True,
            },
        )

    # 2. Magic byte / header check
    # Check common magic numbers
    is_jpeg = raw_bytes.startswith(b"\xff\xd8\xff")
    is_png = raw_bytes.startswith(b"\x89PNG\r\n\x1a\n")
    is_webp = len(raw_bytes) > 12 and raw_bytes[:4] == b"RIFF" and raw_bytes[8:12] == b"WEBP"

    if not (is_jpeg or is_png or is_webp):
        raise HTTPException(
            status_code=415,
            detail={
                "code": "INVALID_FILE_TYPE",
                "message": "Only JPEG, PNG, and WebP images are supported.",
                "retryable": True,
            },
        )

    # 3. Decode image and check dimensions
    try:
        with Image.open(io.BytesIO(raw_bytes)) as img:
            format_name = img.format.lower() if img.format else "jpeg"
            width, height = img.size

            if width < MIN_DIMENSION_PX or height < MIN_DIMENSION_PX:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "code": "DOCUMENT_UNREADABLE",
                        "message": "The image is too small to be a legible document.",
                        "retryable": True,
                    },
                )

            if width > MAX_DIMENSION_PX or height > MAX_DIMENSION_PX:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "code": "FILE_TOO_LARGE",
                        "message": f"Image dimensions ({width}x{height}) exceed maximum allowed limit.",
                        "retryable": True,
                    },
                )

            # 4. Correct EXIF orientation and strip metadata (especially GPS and camera info)
            try:
                img = ImageOps.exif_transpose(img)
            except Exception:
                pass  # If exif transposition fails, continue with original orientation

            # Resize if very large (> 2560px on longest side) to preserve bandwidth while retaining sharpness
            max_side = 2560
            if max(img.width, img.height) > max_side:
                img.thumbnail((max_side, max_side), Image.Resampling.LANCZOS)

            # Convert RGBA to RGB if saving as JPEG
            target_format = "JPEG"
            mime_type = "image/jpeg"
            if img.mode in ("RGBA", "P"):
                # If PNG and has transparency, keep PNG, otherwise RGB
                if is_png:
                    target_format = "PNG"
                    mime_type = "image/png"
                else:
                    img = img.convert("RGB")
            elif img.mode != "RGB":
                img = img.convert("RGB")

            # 5. Save normalized bytes without EXIF
            output = io.BytesIO()
            if target_format == "JPEG":
                img.save(output, format="JPEG", quality=88, optimize=True)
            elif target_format == "PNG":
                img.save(output, format="PNG", optimize=True)
            else:
                img.save(output, format="WEBP", quality=88)

            normalized_bytes = output.getvalue()
            return normalized_bytes, mime_type, img.width, img.height

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "DOCUMENT_UNREADABLE",
                "message": "The document image could not be processed. Please take a clearer photo.",
                "retryable": True,
            },
        )
