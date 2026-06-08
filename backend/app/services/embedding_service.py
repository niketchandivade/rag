from typing import List
from sentence_transformers import SentenceTransformer
from loguru import logger

from app.config import get_settings


class EmbeddingService:
    """Service for generating embeddings using Hugging Face SentenceTransformers."""

    def __init__(self):
        settings = get_settings()
        self.embedding_model = settings.embedding_model
        self.model = SentenceTransformer(self.embedding_model)

    def embed_texts(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for a list of texts."""
        try:
            embeddings = self.model.encode(
                texts,
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Error generating embeddings: {e}")
            raise

    def embed_query(self, query: str) -> List[float]:
        """Generate embedding for a query."""
        try:
            embedding = self.model.encode(
                [query],
                convert_to_numpy=True,
                normalize_embeddings=True
            )
            return embedding[0].tolist()
        except Exception as e:
            logger.error(f"Error generating query embedding: {e}")
            raise

    async def aembed_texts(self, texts: List[str]) -> List[List[float]]:
        """Async generate embeddings for a list of texts."""
        return self.embed_texts(texts)

    async def aembed_query(self, query: str) -> List[float]:
        """Async generate embedding for a query."""
        return self.embed_query(query)