import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface DocumentInfo {
  id: string;
  filename: string;
  source_type: string;
  upload_timestamp: string;
  file_size: number;
  chunk_count?: number;
  processed: boolean;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: SourceCitation[];
  timestamp?: string;
}

export interface SourceCitation {
  chunk_text: string;
  filename: string;
  page_number?: number;
  similarity_score: number;
}

export interface ChatResponse {
  message: string;
  sources: SourceCitation[];
  session_id: string;
}

export interface ProcessStatus {
  status: string;
  message: string;
  documents_processed: number;
  chunks_created: number;
}

export const uploadFiles = async (files: File[]): Promise<DocumentInfo[]> => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('files', file);
  });

  const response = await api.post<{ files: DocumentInfo[]; message: string }>(
    '/upload',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );

  return response.data.files;
};

export const processDocuments = async (): Promise<ProcessStatus> => {
  const response = await api.post<ProcessStatus>('/process');
  return response.data;
};

export const getDocuments = async (): Promise<DocumentInfo[]> => {
  const response = await api.get<DocumentInfo[]>('/documents');
  return response.data;
};

export const deleteDocument = async (filename: string): Promise<void> => {
  await api.delete(`/documents/${encodeURIComponent(filename)}`);
};

export const resetDocuments = async (): Promise<void> => {
  await api.post('/documents/reset');
};

export const getDocumentCount = async (): Promise<{ chunk_count: number }> => {
  const response = await api.get<{ chunk_count: number }>('/documents/count');
  return response.data;
};

export const sendChatMessage = async (
  message: string,
  sessionId?: string
): Promise<ChatResponse> => {
  const response = await api.post<ChatResponse>('/chat/non-stream', {
    message,
    session_id: sessionId,
  });
  return response.data;
};

export const streamChatMessage = async (
  message: string,
  sessionId?: string,
  onChunk: (chunk: string) => void
): Promise<void> => {
  const response = await api.post(
    '/chat',
    {
      message,
      session_id: sessionId,
    },
    {
      responseType: 'stream',
    }
  );

  const reader = response.data.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') return;
        onChunk(data);
      }
    }
  }
};

export const getChatHistory = async (
  sessionId: string
): Promise<{ session_id: string; history: ChatMessage[] }> => {
  const response = await api.get(`/chat/history/${sessionId}`);
  return response.data;
};

export const clearChatHistory = async (
  sessionId: string
): Promise<void> => {
  await api.delete(`/chat/history/${sessionId}`);
};

export default api;