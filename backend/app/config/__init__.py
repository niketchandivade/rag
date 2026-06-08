from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False
    )

    # Local Hugging Face / open-source model
    hf_model: str = "google/flan-t5-small"
    hf_device: str = "cpu"
    max_new_tokens: int = 256
    embedding_model: str = "sentence-transformers/all-MiniLM-L6-v2"

    # ChromaDB
    chroma_persist_directory: str = "./chroma_db"

    # Upload
    max_file_size: int = 52428800
    allowed_mime_types: str = "application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/json"

    # Chunking
    chunk_size: int = 1000
    chunk_overlap: int = 200

    # RAG
    top_k: int = 5
    max_tokens: int = 2000

    # Server
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = True

    # CORS
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    @property
    def allowed_mime_types_list(self) -> list[str]:
        return [m.strip() for m in self.allowed_mime_types.split(",")]


@lru_cache
def get_settings() -> Settings:
    return Settings()