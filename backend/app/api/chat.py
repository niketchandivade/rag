from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from loguru import logger

from app.models.schemas import ChatRequest, ChatResponse
from app.services.rag_service import RAGService


router = APIRouter(prefix="/chat", tags=["Chat"])

# Initialize RAG service
rag_service = RAGService()


@router.post("")
async def chat(request: ChatRequest):
    """Chat with the documents (streaming)."""
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    async def generate():
        try:
            async for token in rag_service.chat(request.message, request.session_id):
                yield f"data: {token}\n\n"
        except Exception as e:
            logger.error(f"Error in chat: {e}")
            yield f"data: Error: {str(e)}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )


@router.post("/non-stream")
async def chat_non_stream(request: ChatRequest):
    """Chat with the documents (non-streaming)."""
    if not request.message or not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    try:
        response, sources, session_id = rag_service.chat_with_history(
            request.message,
            request.session_id
        )

        return ChatResponse(
            message=response,
            sources=sources,
            session_id=session_id
        )
    except Exception as e:
        logger.error(f"Error in chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/history/{session_id}")
async def get_history(session_id: str):
    """Get conversation history for a session."""
    history = rag_service.get_conversation_history(session_id)
    return {"session_id": session_id, "history": history}


@router.delete("/history/{session_id}")
async def clear_history(session_id: str):
    """Clear conversation history for a session."""
    rag_service.clear_conversation(session_id)
    return {"message": "Conversation history cleared", "session_id": session_id}