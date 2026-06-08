'use client';

import { useState, useCallback } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { Chat } from '@/components/chat';
import { DocumentSidebar } from '@/components/document-sidebar';
import { DocumentInfo } from '@/lib/api';

export default function Home() {
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [refreshKey, setRefreshKey] = useState(0);

  const handleFilesUploaded = useCallback((files: DocumentInfo[]) => {
    console.log('Files uploaded:', files);
  }, []);

  const handleProcessComplete = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  const handleDocumentChange = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <span className="text-3xl">📚</span>
            RAG Chat Application
          </h1>
          <p className="text-muted-foreground mt-1">
            Upload documents and chat with them using AI
          </p>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar - Documents */}
          <div className="lg:col-span-3">
            <DocumentSidebar key={refreshKey} onDocumentChange={handleDocumentChange} />
          </div>

          {/* Main area */}
          <div className="lg:col-span-9 space-y-6">
            {/* File uploader */}
            <FileUploader
              onFilesUploaded={handleFilesUploaded}
              onProcessComplete={handleProcessComplete}
            />

            {/* Chat */}
            <Chat sessionId={sessionId} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container mx-auto px-4 py-4 text-center text-sm text-muted-foreground">
          Powered by LangChain, ChromaDB & OpenAI
        </div>
      </footer>
    </div>
  );
}