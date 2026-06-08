from typing import List, Dict, Any
from datetime import datetime

from langchain.text_splitter import RecursiveCharacterTextSplitter

from app.config import get_settings
from app.utils.text_utils import clean_text


class ChunkService:
    """Service for splitting documents into chunks."""

    def __init__(self):
        settings = get_settings()
        self.chunk_size = settings.chunk_size
        self.chunk_overlap = settings.chunk_overlap

        self.splitter = RecursiveCharacterTextSplitter(
            chunk_size=self.chunk_size,
            chunk_overlap=self.chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
            keep_separator=False
        )

    def chunk_documents(
        self,
        parsed_chunks: List[Dict[str, Any]],
        filename: str,
        source_type: str
    ) -> List[Dict[str, Any]]:
        """Chunk parsed document text into smaller pieces."""
        all_chunks = []

        for parsed_chunk in parsed_chunks:
            text = clean_text(parsed_chunk.get("text", ""))
            page_number = parsed_chunk.get("page_number")

            if not text:
                continue

            # Split the text
            text_chunks = self.splitter.split_text(text)

            for chunk_id, chunk_text in enumerate(text_chunks):
                if not chunk_text.strip():
                    continue

                chunk_data = {
                    "text": chunk_text,
                    "metadata": {
                        "filename": filename,
                        "source_type": source_type,
                        "chunk_id": chunk_id,
                        "page_number": page_number,
                        "upload_timestamp": datetime.now().isoformat()
                    }
                }
                all_chunks.append(chunk_data)

        return all_chunks

    def chunk_text(
        self,
        text: str,
        filename: str,
        source_type: str,
        page_number: int | None = None
    ) -> List[Dict[str, Any]]:
        """Chunk a single text string."""
        text = clean_text(text)
        if not text:
            return []

        text_chunks = self.splitter.split_text(text)

        chunks = []
        for chunk_id, chunk_text in enumerate(text_chunks):
            if not chunk_text.strip():
                continue

            chunks.append({
                "text": chunk_text,
                "metadata": {
                    "filename": filename,
                    "source_type": source_type,
                    "chunk_id": chunk_id,
                    "page_number": page_number,
                    "upload_timestamp": datetime.now().isoformat()
                }
            })

        return chunks