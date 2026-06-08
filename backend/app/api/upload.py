import os
import aiofiles
from datetime import datetime
from pathlib import Path
from typing import List

from fastapi import APIRouter, UploadFile, File, HTTPException
from loguru import logger

from app.config import get_settings
from app.models.schemas import DocumentInfo, UploadResponse
from app.utils.file_utils import (
    generate_document_id,
    get_file_extension,
    get_mime_type_from_extension,
    sanitize_filename
)


router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("", response_model=UploadResponse)
async def upload_files(files: List[UploadFile] = File(...)):
    """Upload multiple files."""
    settings = get_settings()
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)

    uploaded_docs = []
    errors = []

    for file in files:
        try:
            # Validate file
            if file.size and file.size > settings.max_file_size:
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} exceeds maximum size of {settings.max_file_size / 1024 / 1024}MB"
                )

            # Get file extension
            extension = get_file_extension(file.filename)
            if not extension:
                raise HTTPException(
                    status_code=400,
                    detail=f"File {file.filename} has no extension"
                )

            # Check if supported
            if extension not in ["pdf", "txt", "csv", "xlsx", "xls", "docx", "doc", "json"]:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type: {extension}"
                )

            # Sanitize filename
            safe_filename = sanitize_filename(file.filename)
            doc_id = generate_document_id(safe_filename)

            # Save file
            file_path = upload_dir / f"{doc_id}_{safe_filename}"

            async with aiofiles.open(file_path, "wb") as f:
                content = await file.read()
                await f.write(content)

            # Create document info
            doc_info = DocumentInfo(
                id=doc_id,
                filename=safe_filename,
                source_type=extension,
                upload_timestamp=datetime.now(),
                file_size=len(content),
                processed=False
            )
            uploaded_docs.append(doc_info)

            logger.info(f"Uploaded file: {safe_filename} ({len(content)} bytes)")

        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error uploading file {file.filename}: {e}")
            errors.append(f"Error uploading {file.filename}: {str(e)}")

    if not uploaded_docs and errors:
        raise HTTPException(status_code=400, detail=errors[0])

    return UploadResponse(
        files=uploaded_docs,
        message=f"Successfully uploaded {len(uploaded_docs)} file(s)"
    )