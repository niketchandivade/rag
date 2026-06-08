from pathlib import Path
from datetime import datetime
from typing import List
import os

from fastapi import APIRouter, HTTPException
from loguru import logger

from app.models.schemas import DocumentInfo
from app.services.vector_service import VectorService


router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("", response_model=List[DocumentInfo])
async def get_documents():
    """Get list of uploaded documents."""
    upload_dir = Path("uploads")

    if not upload_dir.exists():
        return []

    documents = []
    vector_service = VectorService()
    unique_filenames = vector_service.get_unique_filenames()

    for file_path in upload_dir.glob("*"):
        if not file_path.is_file():
            continue

        # Skip chunk files
        if file_path.name.startswith("chunk_"):
            continue

        filename = file_path.name
        # Remove the ID prefix if present
        if "_" in filename:
            parts = filename.split("_", 1)
            if len(parts) > 1:
                filename = parts[1]

        extension = file_path.suffix.lstrip(".").lower()
        stat = file_path.stat()

        # Check if processed
        processed = filename in unique_filenames

        # Generate ID from filename
        doc_id = filename[:16] if len(filename) >= 16 else filename

        documents.append(DocumentInfo(
            id=doc_id,
            filename=filename,
            source_type=extension,
            upload_timestamp=datetime.fromtimestamp(stat.st_mtime),
            file_size=stat.st_size,
            processed=processed
        ))

    return documents


@router.delete("/{filename}")
async def delete_document(filename: str):
    """Delete a document and its vectors."""
    try:
        vector_service = VectorService()

        # Delete from vector store
        deleted_chunks = vector_service.delete_by_filename(filename)

        # Delete file
        upload_dir = Path("uploads")
        file_path = None

        for f in upload_dir.glob("*"):
            if f.is_file() and filename in f.name:
                file_path = f
                break

        if file_path and file_path.exists():
            file_path.unlink()
            logger.info(f"Deleted file: {file_path.name}")

        return {
            "message": f"Deleted document {filename}",
            "chunks_deleted": deleted_chunks
        }

    except Exception as e:
        logger.error(f"Error deleting document: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/count")
async def get_document_count():
    """Get count of chunks in vector store."""
    try:
        vector_service = VectorService()
        count = vector_service.get_document_count()
        return {"chunk_count": count}
    except Exception as e:
        logger.error(f"Error getting document count: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/reset")
async def reset_documents():
    """Reset all documents and vector store."""
    try:
        vector_service = VectorService()
        vector_service.reset()

        # Delete uploaded files
        upload_dir = Path("uploads")
        if upload_dir.exists():
            for f in upload_dir.glob("*"):
                if f.is_file():
                    f.unlink()

        return {"message": "All documents and vectors have been reset"}
    except Exception as e:
        logger.error(f"Error resetting documents: {e}")
        raise HTTPException(status_code=500, detail=str(e))