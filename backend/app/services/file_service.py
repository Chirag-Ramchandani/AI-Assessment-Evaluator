from pathlib import Path
from uuid import uuid4
from fastapi import UploadFile

# Vercel serverless environment:
# /tmp is the writable temporary directory.
UPLOAD_DIR = Path("/tmp/uploads")

ALLOWED_EXTENSIONS = {".pdf"}
MAX_FILE_SIZE = 15 * 1024 * 1024  # 15 MB


async def save_pdf(file: UploadFile) -> dict:
    """
    Validates and temporarily saves the uploaded PDF.

    Works both locally and on Vercel because files are
    stored inside /tmp.
    """

    if not file.filename:
        raise ValueError("File name is missing.")

    extension = Path(file.filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValueError("Only PDF files are allowed.")

    content = await file.read()

    if not content:
        raise ValueError("Uploaded file is empty.")

    if len(content) > MAX_FILE_SIZE:
        raise ValueError("File size exceeds 15 MB limit.")

    file_id = uuid4().hex
    saved_filename = f"{file_id}.pdf"

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    file_path = UPLOAD_DIR / saved_filename

    file_path.write_bytes(content)

    return {
        "original_filename": file.filename,
        "saved_filename": saved_filename,
        "path": str(file_path),
        "size": len(content),
    }