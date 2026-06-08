import os
from pathlib import Path
from typing import List

from fastapi import APIRouter, HTTPException
from loguru import logger

from app.config import get_settings
from app.models.schemas import ProcessStatus
from app.services.parser_service import DocumentParser
from app.services.chunk_service import ChunkService
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService


router = APIRouter(prefix="/process", tags=["Process"])


@router.post("", response_model=ProcessStatus)
async def process_documents():
    """Process all uploaded documents into embeddings."""
    settings = get_settings()
    upload_dir = Path("uploads")

    if not upload_dir.exists():
        raise HTTPException(status_code=400, detail="No files to process")

    # Initialize services
    parser = DocumentParser()
    chunk_service = ChunkService()
    embedding_service = EmbeddingService()
    vector_service = VectorService()

    # Get all files in upload directory
    files = list(upload_dir.glob("*"))
    if not files:
        raise HTTPException(status_code=400, detail="No files to process")

    total_chunks = 0
    documents_processed = 0

    for file_path in files:
        if not file_path.is_file():
            continue

        try:
            filename = file_path.name
            # Skip if has already been processed (has chunk prefix)
            if filename.startswith("chunk_"):
                continue

            # Get extension
            extension = file_path.suffix.lstrip(".").lower()
            if extension not in ["pdf", "txt", "csv", "xlsx", "xls", "docx", "doc", "json"]:
                continue

            logger.info(f"Processing: {filename}")

            # Parse document
            parsed_chunks = parser.parse_file(str(file_path), extension)
            if not parsed_chunks:
                logger.warning(f"No content extracted from {filename}")
                continue

            # Chunk documents
            chunks = chunk_service.chunk_documents(
                parsed_chunks,
                filename,
                extension
            )
            total_chunks += len(chunks)

            if not chunks:
                continue

            # Generate embeddings
            texts = [chunk["text"] for chunk in chunks]
            embeddings = embedding_service.embed_texts(texts)

            # Store in vector database
            vector_service.add_chunks(chunks, embeddings)

            documents_processed += 1
            logger.info(f"Processed {filename}: {len(chunks)} chunks")

        except Exception as e:
            logger.error(f"Error processing {file_path.name}: {e}")
            continue

    return ProcessStatus(
        status="completed",
        message=f"Successfully processed {documents_processed} document(s)",
        documents_processed=documents_processed,
        chunks_created=total_chunks
    )