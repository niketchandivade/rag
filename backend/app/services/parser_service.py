import json
import io
from typing import List, Dict, Any, Optional
from pathlib import Path

from loguru import logger

# PDF
try:
    from pypdf import PdfReader
except ImportError:
    PdfReader = None

# DOCX
try:
    from docx import Document as DocxDocument
except ImportError:
    DocxDocument = None

# CSV/XLSX
try:
    import pandas as pd
except ImportError:
    pd = None


class DocumentParser:
    """Parse various document formats into text."""

    SUPPORTED_EXTENSIONS = {
        "pdf": "application/pdf",
        "txt": "text/plain",
        "csv": "text/csv",
        "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "xls": "application/vnd.ms-excel",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "doc": "application/msword",
        "json": "application/json",
    }

    @staticmethod
    def parse_file(file_path: str, extension: str) -> List[Dict[str, Any]]:
        """Parse a file and return list of text chunks with metadata."""
        parsers = {
            "pdf": DocumentParser._parse_pdf,
            "txt": DocumentParser._parse_txt,
            "csv": DocumentParser._parse_csv,
            "xlsx": DocumentParser._parse_xlsx,
            "xls": DocumentParser._parse_xlsx,
            "docx": DocumentParser._parse_docx,
            "doc": DocumentParser._parse_doc,
            "json": DocumentParser._parse_json,
        }

        parser = parsers.get(extension.lower())
        if not parser:
            raise ValueError(f"Unsupported file type: {extension}")

        return parser(file_path)

    @staticmethod
    def _parse_pdf(file_path: str) -> List[Dict[str, Any]]:
        """Parse PDF file."""
        if PdfReader is None:
            raise ImportError("pypdf is required for PDF parsing")

        chunks = []
        try:
            reader = PdfReader(file_path)
            for page_num, page in enumerate(reader.pages, start=1):
                text = page.extract_text()
                if text and text.strip():
                    chunks.append({
                        "text": text,
                        "page_number": page_num,
                        "source_type": "pdf"
                    })
        except Exception as e:
            logger.error(f"Error parsing PDF {file_path}: {e}")
            raise

        return chunks

    @staticmethod
    def _parse_txt(file_path: str) -> List[Dict[str, Any]]:
        """Parse plain text file."""
        chunks = []
        try:
            with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                text = f.read()
            if text.strip():
                chunks.append({
                    "text": text,
                    "page_number": None,
                    "source_type": "txt"
                })
        except Exception as e:
            logger.error(f"Error parsing TXT {file_path}: {e}")
            raise

        return chunks

    @staticmethod
    def _parse_csv(file_path: str) -> List[Dict[str, Any]]:
        """Parse CSV file."""
        if pd is None:
            raise ImportError("pandas is required for CSV parsing")

        chunks = []
        try:
            df = pd.read_csv(file_path)
            # Convert each row to text
            for idx, row in df.iterrows():
                text = " | ".join([f"{col}: {val}" for col, val in row.items() if pd.notna(val)])
                if text.strip():
                    chunks.append({
                        "text": text,
                        "page_number": idx + 1,
                        "source_type": "csv"
                    })
            # Also add a summary chunk
            summary = f"CSV file with {len(df)} rows and {len(df.columns)} columns: {', '.join(df.columns)}"
            chunks.insert(0, {
                "text": summary,
                "page_number": None,
                "source_type": "csv"
            })
        except Exception as e:
            logger.error(f"Error parsing CSV {file_path}: {e}")
            raise

        return chunks

    @staticmethod
    def _parse_xlsx(file_path: str) -> List[Dict[str, Any]]:
        """Parse Excel XLSX file."""
        if pd is None:
            raise ImportError("pandas is required for XLSX parsing")

        chunks = []
        try:
            # Read all sheets
            excel_file = pd.ExcelFile(file_path)
            for sheet_name in excel_file.sheet_names:
                df = pd.read_excel(file_path, sheet_name=sheet_name)
                # Add sheet summary
                summary = f"Sheet: {sheet_name} | Rows: {len(df)} | Columns: {len(df.columns)}: {', '.join(df.columns)}"
                chunks.append({
                    "text": summary,
                    "page_number": None,
                    "source_type": "xlsx"
                })
                # Add rows
                for idx, row in df.iterrows():
                    text = " | ".join([f"{col}: {val}" for col, val in row.items() if pd.notna(val)])
                    if text.strip():
                        chunks.append({
                            "text": text,
                            "page_number": idx + 1,
                            "source_type": "xlsx"
                        })
        except Exception as e:
            logger.error(f"Error parsing XLSX {file_path}: {e}")
            raise

        return chunks

    @staticmethod
    def _parse_docx(file_path: str) -> List[Dict[str, Any]]:
        """Parse DOCX file."""
        if DocxDocument is None:
            raise ImportError("python-docx is required for DOCX parsing")

        chunks = []
        try:
            doc = DocxDocument(file_path)
            paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

            if paragraphs:
                # Combine all paragraphs
                full_text = "\n\n".join(paragraphs)
                chunks.append({
                    "text": full_text,
                    "page_number": None,
                    "source_type": "docx"
                })
        except Exception as e:
            logger.error(f"Error parsing DOCX {file_path}: {e}")
            raise

        return chunks

    @staticmethod
    def _parse_doc(file_path: str) -> List[Dict[str, Any]]:
        """Parse legacy DOC file - returns message about format."""
        # DOC is binary format, hard to parse without additional libraries
        return [{
            "text": f"Legacy DOC file: {Path(file_path).name}. Consider converting to DOCX for better parsing.",
            "page_number": None,
            "source_type": "doc"
        }]

    @staticmethod
    def _parse_json(file_path: str) -> List[Dict[str, Any]]:
        """Parse JSON file."""
        chunks = []
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            # Convert JSON to readable text
            text = json.dumps(data, indent=2)
            chunks.append({
                "text": text,
                "page_number": None,
                "source_type": "json"
            })

            # Also add structured representation
            if isinstance(data, dict):
                summary = " | ".join([f"{k}: {type(v).__name__}" for k, v in data.items()])
                chunks.insert(0, {
                    "text": f"JSON object with keys: {summary}",
                    "page_number": None,
                    "source_type": "json"
                })
            elif isinstance(data, list):
                chunks.insert(0, {
                    "text": f"JSON array with {len(data)} items",
                    "page_number": None,
                    "source_type": "json"
                })
        except Exception as e:
            logger.error(f"Error parsing JSON {file_path}: {e}")
            raise

        return chunks


def get_text_from_chunks(chunks: List[Dict[str, Any]]) -> str:
    """Extract all text from parsed chunks."""
    return "\n\n".join([chunk["text"] for chunk in chunks])