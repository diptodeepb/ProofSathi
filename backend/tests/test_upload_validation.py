"""Test upload image validation and sanitization."""
import io
import pytest
from fastapi import HTTPException
from PIL import Image
from app.services.image_service import validate_and_normalize_image


def test_reject_empty_file():
    with pytest.raises(HTTPException) as exc_info:
        validate_and_normalize_image(b"")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "INVALID_FILE_TYPE"


def test_reject_invalid_magic_bytes():
    fake_exe = b"MZ\x90\x00\x03\x00\x00\x00This is an executable not an image"
    with pytest.raises(HTTPException) as exc_info:
        validate_and_normalize_image(fake_exe)
    assert exc_info.value.status_code == 415
    assert exc_info.value.detail["code"] == "INVALID_FILE_TYPE"


def test_accept_valid_jpeg():
    img = Image.new("RGB", (200, 200), color="blue")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    jpeg_bytes = buf.getvalue()

    norm_bytes, mime, w, h = validate_and_normalize_image(jpeg_bytes)
    assert mime == "image/jpeg"
    assert w == 200
    assert h == 200
    assert len(norm_bytes) > 0


def test_accept_valid_png():
    img = Image.new("RGBA", (150, 150), color=(255, 0, 0, 128))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    norm_bytes, mime, w, h = validate_and_normalize_image(png_bytes)
    assert mime == "image/png"
    assert w == 150
    assert h == 150
    assert len(norm_bytes) > 0


def test_reject_tiny_unreadable_image():
    img = Image.new("RGB", (10, 10), color="white")
    buf = io.BytesIO()
    img.save(buf, format="JPEG")
    tiny_bytes = buf.getvalue()

    with pytest.raises(HTTPException) as exc_info:
        validate_and_normalize_image(tiny_bytes)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail["code"] == "DOCUMENT_UNREADABLE"
