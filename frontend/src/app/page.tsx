'use client';

import { useState, useCallback } from 'react';
import { FileUploader } from '@/components/file-uploader';
import { Chat } from '@/components/chat';
import { DocumentSidebar } from '@/components/document-sidebar';
import { DocumentInfo } from '@/lib/api';
import { Sparkles, Github, ChevronDown, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Home() {
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));
  const [refreshKey, setRefreshKey] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
      {/* Background gradient effect */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-glow-sm">
                <Sparkles className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold leading-tight">
                  RAG Chat
                </h1>
                <p className="text-xs text-muted-foreground -mt-0.5">
                  AI-powered document assistant
                </p>
              </div>
            </div>

            {/* Navigation - Desktop */}
            <nav className="hidden md:flex items-center gap-6">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Features
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Docs
              </a>
              <Button variant="outline" size="sm" className="gap-2">
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </Button>
            </nav>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur-xl animate-fade-in-down">
            <div className="container mx-auto px-4 py-4 space-y-3">
              <a
                href="#"
                className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Features
              </a>
              <a
                href="#"
                className="block py-2 text-sm text-muted-foreground hover:text-foreground"
              >
                Docs
              </a>
              <Button variant="outline" size="sm" className="w-full gap-2">
                <Github className="h-4 w-4" />
                <span>GitHub</span>
              </Button>
            </div>
          </div>
        )}
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar - Documents */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-24">
              <DocumentSidebar
                key={refreshKey}
                onDocumentChange={handleDocumentChange}
              />
            </div>
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
      <footer className="border-t mt-auto bg-muted/30">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Powered by{' '}
              <span className="font-medium text-foreground">LangChain</span>
              {', '}
              <span className="font-medium text-foreground">ChromaDB</span>
              {' & '}
              <span className="font-medium text-foreground">OpenAI</span>
            </p>
            <div className="flex items-center gap-4">
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Privacy
              </a>
              <a
                href="#"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Terms
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}