from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime
import os

import chromadb
from chromadb.config import Settings as ChromaSettings
from loguru import logger

from app.config import get_settings


class VectorService:
    """Service for managing vector storage with ChromaDB."""

    def __init__(self):
        settings = get_settings()
        self.persist_directory = settings.chroma_persist_directory

        # Ensure directory exists
        os.makedirs(self.persist_directory, exist_ok=True)

        self.client = chromadb.PersistentClient(
            path=self.persist_directory,
            settings=ChromaSettings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )

        # Create or get collection
        self.collection = self.client.get_or_create_collection(
            name="documents",
            metadata={"description": "Document chunks with embeddings"}
        )

    def add_chunks(
        self,
        chunks: List[Dict[str, Any]],
        embeddings: List[List[float]]
    ) -> None:
        """Add chunks with embeddings to the collection."""
        if len(chunks) != len(embeddings):
            raise ValueError("Number of chunks must match number of embeddings")

        ids = []
        documents = []
        metadatas = []

        for i, chunk in enumerate(chunks):
            chunk_id = f"chunk_{uuid.uuid4().hex[:8]}"
            ids.append(chunk_id)
            documents.append(chunk["text"])
            metadatas.append(chunk["metadata"])

        try:
            self.collection.add(
                ids=ids,
                documents=documents,
                embeddings=embeddings,
                metadatas=metadatas
            )
            logger.info(f"Added {len(chunks)} chunks to ChromaDB")
        except Exception as e:
            logger.error(f"Error adding chunks to ChromaDB: {e}")
            raise

    def similarity_search(
        self,
        query_embedding: List[float],
        k: int = 5,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Perform similarity search."""
        try:
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=k,
                where=filter_metadata
            )

            search_results = []
            if results and results.get("documents"):
                for i in range(len(results["documents"][0])):
                    search_results.append({
                        "text": results["documents"][0][i],
                        "metadata": results["metadatas"][0][i] if results.get("metadatas") else {},
                        "distance": results["distances"][0][i] if results.get("distances") else 0.0,
                        "id": results["ids"][0][i]
                    })

            return search_results
        except Exception as e:
            logger.error(f"Error performing similarity search: {e}")
            raise

    def get_all_documents(self) -> List[Dict[str, Any]]:
        """Get all documents in the collection."""
        try:
            results = self.collection.get()

            documents = []
            if results and results.get("ids"):
                for i in range(len(results["ids"])):
                    documents.append({
                        "id": results["ids"][i],
                        "text": results["documents"][i] if results.get("documents") else "",
                        "metadata": results["metadatas"][i] if results.get("metadatas") else {}
                    })

            return documents
        except Exception as e:
            logger.error(f"Error getting all documents: {e}")
            raise

    def delete_by_filename(self, filename: str) -> int:
        """Delete all chunks for a specific filename."""
        try:
            # Get all chunks with this filename
            results = self.collection.get()
            ids_to_delete = []

            if results and results.get("ids"):
                for i in range(len(results["ids"])):
                    metadata = results["metadatas"][i] if results.get("metadatas") else {}
                    if metadata.get("filename") == filename:
                        ids_to_delete.append(results["ids"][i])

            if ids_to_delete:
                self.collection.delete(ids=ids_to_delete)
                logger.info(f"Deleted {len(ids_to_delete)} chunks for filename: {filename}")

            return len(ids_to_delete)
        except Exception as e:
            logger.error(f"Error deleting chunks by filename: {e}")
            raise

    def get_unique_filenames(self) -> List[str]:
        """Get list of unique filenames in the collection."""
        try:
            results = self.collection.get()
            filenames = set()

            if results and results.get("metadatas"):
                for metadata in results["metadatas"]:
                    if metadata and "filename" in metadata:
                        filenames.add(metadata["filename"])

            return sorted(list(filenames))
        except Exception as e:
            logger.error(f"Error getting unique filenames: {e}")
            raise

    def get_document_count(self) -> int:
        """Get total number of chunks in collection."""
        try:
            return self.collection.count()
        except Exception as e:
            logger.error(f"Error getting document count: {e}")
            raise

    def reset(self) -> None:
        """Reset the collection."""
        try:
            self.client.delete_collection(name="documents")
            self.collection = self.client.get_or_create_collection(
                name="documents",
                metadata={"description": "Document chunks with embeddings"}
            )
            logger.info("ChromaDB collection reset")
        except Exception as e:
            logger.error(f"Error resetting collection: {e}")
            raise