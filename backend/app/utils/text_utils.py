import re
from typing import List


def clean_text(text: str) -> str:
    """Clean and normalize text."""
    if not text:
        return ""

    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text)
    text = text.strip()

    # Remove control characters
    text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\r\t')

    return text


def split_into_sentences(text: str) -> List[str]:
    """Split text into sentences."""
    # Simple sentence splitting
    sentence_endings = re.compile(r'(?<=[.!?])\s+')
    sentences = sentence_endings.split(text)
    return [s.strip() for s in sentences if s.strip()]


def truncate_text(text: str, max_length: int, suffix: str = "...") -> str:
    """Truncate text to max length."""
    if len(text) <= max_length:
        return text
    return text[:max_length - len(suffix)] + suffix


def extract_page_number(text: str) -> int | None:
    """Extract page number from text if present."""
    # Look for common page number patterns
    patterns = [
        r'page\s+(\d+)',
        r'page\s+(\d+)\s+of',
        r'(\d+)\s*-\s*\d+',  # e.g., "1-1"
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            try:
                return int(match.group(1))
            except (ValueError, IndexError):
                pass

    return None