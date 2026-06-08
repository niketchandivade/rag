from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime


class DocumentMetadata(BaseModel):
    filename: str
    source_type: str
    upload_timestamp: datetime
    file_size: int
    chunk_count: Optional[int] = None


class DocumentInfo(BaseModel):
    id: str
    filename: str
    source_type: str
    upload_timestamp: datetime
    file_size: int
    chunk_count: Optional[int] = None
    processed: bool = False


class ChunkMetadata(BaseModel):
    filename: str
    source_type: str
    chunk_id: int
    page_number: Optional[int] = None
    upload_timestamp: datetime


class ChatMessage(BaseModel):
    role: str
    content: str
    timestamp: Optional[datetime] = None


class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    message: str
    sources: List[Dict[str, Any]] = []
    session_id: str


class SourceCitation(BaseModel):
    chunk_text: str
    filename: str
    page_number: Optional[int] = None
    similarity_score: float


class ProcessStatus(BaseModel):
    status: str
    message: str
    documents_processed: int = 0
    chunks_created: int = 0


class UploadResponse(BaseModel):
    files: List[DocumentInfo]
    message: str


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None