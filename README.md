# RAG Chat Application

A production-ready full-stack RAG (Retrieval-Augmented Generation) application that allows users to upload documents and chat with them using AI-powered semantic search.

## Features

- **Multi-format Document Support**: PDF, TXT, CSV, XLSX, DOCX, JSON
- **Document Processing**: Automatic text extraction, chunking, and embedding generation
- **Semantic Search**: ChromaDB-powered vector similarity search
- **Chat Interface**: ChatGPT-like UI with streaming responses
- **Source Citations**: View the source documents used for answers
- **Responsive Design**: Works on desktop and mobile devices

## Architecture

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- React Dropzone for file uploads
- React Markdown for rendering

### Backend
- Python FastAPI
- Async architecture
- LangChain for RAG
- ChromaDB for vector storage
- OpenAI embeddings & GPT

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- OpenAI API key

### Option 1: Local Development

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy and configure .env
cp .env.example .env
# Edit .env with your OpenAI API key

# Run the backend
uvicorn app.main:app --reload
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run the frontend
npm run dev
```

Access the application at http://localhost:3000

### Option 2: Docker

```bash
# Set your OpenAI API key
export OPENAI_API_KEY=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

# Start all services
docker-compose up --build

# Or run in detached mode
docker-compose up -d --build
```

Access the frontend at http://localhost:3000
Access the API at http://localhost:8000

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/upload` | POST | Upload multiple files |
| `/process` | POST | Process uploaded documents |
| `/chat` | POST | Stream chat messages |
| `/chat/non-stream` | POST | Non-streaming chat |
| `/documents` | GET | List all documents |
| `/documents/{filename}` | DELETE | Delete a document |
| `/documents/reset` | POST | Reset all documents |
| `/documents/count` | GET | Get chunk count |
| `/health` | GET | Health check |

## Environment Variables

### Backend (.env)
```env
OPENAI_API_KEY=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
OPENAI_MODEL=gpt-4o-mini
EMBEDDING_MODEL=text-embedding-3-small
CHROMA_PERSIST_DIRECTORY=./chroma_db
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
TOP_K=5
MAX_TOKENS=2000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Folder Structure

```
rag/
├── backend/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── services/      # Business logic
│   │   ├── models/        # Pydantic models
│   │   ├── utils/         # Utilities
│   │   ├── config/        # Configuration
│   │   └── main.py        # Entry point
│   ├── uploads/           # Uploaded files
│   ├── chroma_db/         # Vector database
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── app/           # Next.js pages
│   │   ├── components/    # React components
│   │   └── lib/           # Utilities & API
│   ├── package.json
│   ├── Dockerfile
│   └── .env.local
├── docker-compose.yml
└── README.md
```

## Usage

1. **Upload Documents**: Drag and drop files or click to select files
2. **Process**: Click "Process Documents" to generate embeddings
3. **Chat**: Ask questions about your documents
4. **View Sources**: Expand source citations to see relevant chunks

## Technologies

- **LangChain**: LLM framework with prompt management
- **ChromaDB**: Vector database for embeddings
- **OpenAI**: Embeddings (text-embedding-3-small) and GPT (gpt-4o-mini)
- **Next.js**: React framework with App Router
- **FastAPI**: Modern Python web framework
- **shadcn/ui**: Beautiful UI components

## License

MIT# rag
