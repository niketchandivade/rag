import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger

from app.config import get_settings
from app.api import upload, process, chat, documents


# Configure logging
logger.add(
    "logs/app.log",
    rotation="10 MB",
    retention="7 days",
    level="INFO"
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events."""
    logger.info("Starting RAG application...")
    yield
    logger.info("Shutting down RAG application...")


# Create FastAPI app
app = FastAPI(
    title="RAG API",
    description="Retrieval-Augmented Generation API for document chat",
    version="1.0.0",
    lifespan=lifespan
)

# Get settings
settings = get_settings()

# Configure CORS
origins = settings.cors_origins.split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(upload.router)
app.include_router(process.router)
app.include_router(chat.router)
app.include_router(documents.router)


@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "name": "RAG API",
        "version": "1.0.0",
        "status": "running"
    }


@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.debug
    )