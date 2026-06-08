from typing import List, Dict, Any, AsyncGenerator, Optional
from datetime import datetime
import uuid

from loguru import logger

from app.config import get_settings
from app.services.embedding_service import EmbeddingService
from app.services.vector_service import VectorService
from app.services.llm_service import LLMService


class RAGService:
    """Service for RAG (Retrieval-Augmented Generation) operations."""

    def __init__(self):
        self.embedding_service = EmbeddingService()
        self.vector_service = VectorService()
        self.llm_service = LLMService()
        settings = get_settings()
        self.top_k = settings.top_k

        # In-memory conversation history
        self.conversations: Dict[str, List[Dict[str, Any]]] = {}

    async def chat(
        self,
        message: str,
        session_id: Optional[str] = None
    ) -> AsyncGenerator[str, None]:
        """Process a chat message and stream response."""
        if not session_id:
            session_id = str(uuid.uuid4())

        # Initialize conversation if needed
        if session_id not in self.conversations:
            self.conversations[session_id] = []

        # Add user message to history
        self.conversations[session_id].append({
            "role": "user",
            "content": message,
            "timestamp": datetime.now().isoformat()
        })

        try:
            # Generate query embedding
            query_embedding = await self.embedding_service.aembed_query(message)

            # Search for relevant chunks
            search_results = self.vector_service.similarity_search(
                query_embedding=query_embedding,
                k=self.top_k
            )

            if not search_results:
                yield "No relevant documents found. Please upload and process documents first."
                return

            # Build RAG prompt
            prompt = self.llm_service.build_rag_prompt(message, search_results)

            # Stream response
            async for token in self.llm_service.generate_stream(prompt):
                yield token

            # Add assistant response to history
            # Note: We can't add the full response here since we're streaming
            # In a real implementation, you'd accumulate and store after streaming

        except Exception as e:
            logger.error(f"Error in chat: {e}")
            yield f"Error processing message: {str(e)}"

    def chat_with_history(
        self,
        message: str,
        session_id: Optional[str] = None
    ) -> tuple[str, List[Dict[str, Any]], str]:
        """Process chat message with full response (for non-streaming)."""
        if not session_id:
            session_id = str(uuid.uuid4())

        if session_id not in self.conversations:
            self.conversations[session_id] = []

        self.conversations[session_id].append({
            "role": "user",
            "content": message,
            "timestamp": datetime.now().isoformat()
        })

        try:
            # Generate query embedding
            query_embedding = self.embedding_service.embed_query(message)

            # Search for relevant chunks
            search_results = self.vector_service.similarity_search(
                query_embedding=query_embedding,
                k=self.top_k
            )

            if not search_results:
                return "No relevant documents found. Please upload and process documents first.", [], session_id

            # Build RAG prompt
            prompt = self.llm_service.build_rag_prompt(message, search_results)

            # Generate response
            response = self.llm_service.generate(prompt)

            # Format sources
            sources = []
            for chunk in search_results:
                sources.append({
                    "chunk_text": chunk["text"][:200] + "..." if len(chunk["text"]) > 200 else chunk["text"],
                    "filename": chunk["metadata"].get("filename", "Unknown"),
                    "page_number": chunk["metadata"].get("page_number"),
                    "similarity_score": 1.0 - chunk.get("distance", 0.0)
                })

            # Add to history
            self.conversations[session_id].append({
                "role": "assistant",
                "content": response,
                "timestamp": datetime.now().isoformat()
            })

            return response, sources, session_id

        except Exception as e:
            logger.error(f"Error in chat with history: {e}")
            return f"Error processing message: {str(e)}", [], session_id

    def get_conversation_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Get conversation history for a session."""
        return self.conversations.get(session_id, [])

    def clear_conversation(self, session_id: str) -> None:
        """Clear conversation history for a session."""
        if session_id in self.conversations:
            del self.conversations[session_id]