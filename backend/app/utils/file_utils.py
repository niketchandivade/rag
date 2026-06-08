import hashlib
import os
from datetime import datetime
from typing import Optional


def generate_document_id(filename: str) -> str:
    """Generate a unique document ID based on filename and timestamp."""
    timestamp = datetime.now().isoformat()
    hash_input = f"{filename}_{timestamp}".encode()
    return hashlib.sha256(hash_input).hexdigest()[:16]


def generate_session_id() -> str:
    """Generate a unique session ID."""
    timestamp = datetime.now().isoformat()
    hash_input = timestamp.encode()
    return hashlib.sha256(hash_input).hexdigest()[:16]


def get_file_extension(filename: str) -> str:
    """Get file extension without the dot."""
    return os.path.splitext(filename)[1].lower().lstrip(".")


def get_mime_type_from_extension(extension: str) -> Optional[str]:
    """Map file extension to MIME type."""
    mime_types = {
        "pdf": "application/pdf",
        "txt": "text/plain",
        "csv": "text/csv",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xls": "application/vnd.ms-excel",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "doc": "application/msword",
        "json": "application/json",
    }
    return mime_types.get(extension.lower())


def format_file_size(size_bytes: int) -> str:
    """Format file size in human-readable format."""
    for unit in ["B", "KB", "MB", "GB"]:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to remove potentially dangerous characters."""
    # Remove path separators
    filename = os.path.basename(filename)
    # Replace potentially dangerous characters
    filename = "".join(c for c in filename if c.isalnum() or c in "._- ")
    return filename


def ensure_directory(path: str) -> None:
    """Ensure directory exists."""
    os.makedirs(path, exist_ok=True)