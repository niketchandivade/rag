'use client';

import { useEffect, useState } from 'react';
import {
  File,
  Trash2,
  RefreshCw,
  AlertCircle,
  FileText,
  Database,
  Clock,
  HardDrive,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { SkeletonDocument, SkeletonList } from '@/components/ui/skeleton';
import {
  getDocuments,
  deleteDocument,
  resetDocuments,
  DocumentInfo,
} from '@/lib/api';
import { cn } from '@/lib/utils';

interface DocumentSidebarProps {
  onDocumentChange: () => void;
}

interface DocumentCardProps {
  doc: DocumentInfo;
  onDelete: () => void;
  isDeleting: boolean;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Document card component
function DocumentCard({ doc, onDelete, isDeleting }: DocumentCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={cn(
        'relative bg-card border rounded-xl p-4 transition-all duration-200',
        isHovered ? 'border-primary/30 shadow-elevated' : 'border-border shadow-soft'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'h-10 w-10 rounded-lg flex items-center justify-center transition-colors',
            doc.processed
              ? 'bg-green-100 dark:bg-green-900/30'
              : 'bg-muted'
          )}
        >
          <FileText
            className={cn(
              'h-5 w-5',
              doc.processed
                ? 'text-green-600 dark:text-green-400'
                : 'text-muted-foreground'
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-sm truncate" title={doc.filename}>
            {doc.filename}
          </p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <Badge
              variant="outline"
              className="text-[10px] bg-muted/30"
            >
              {doc.source_type}
            </Badge>
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <HardDrive className="h-3 w-3" />
              {formatFileSize(doc.file_size)}
            </span>
          </div>
          <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatDate(doc.upload_timestamp)}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          className={cn(
            'absolute top-2 right-2 opacity-0 transition-opacity',
            isHovered && 'opacity-100'
          )}
          onClick={onDelete}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
          ) : (
            <Trash2 className="h-4 w-4 text-destructive" />
          )}
        </Button>
      </div>
      <div className="mt-3 pt-3 border-t border-border/50">
        <Badge
          variant={doc.processed ? 'secondary' : 'outline'}
          className={cn(
            'text-[10px]',
            doc.processed
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400'
          )}
        >
          {doc.processed ? (
            <>
              <Database className="h-3 w-3 mr-1" />
              Indexed
            </>
          ) : (
            <>
              <Clock className="h-3 w-3 mr-1" />
              Pending
            </>
          )}
        </Badge>
        {doc.chunk_count && doc.chunk_count > 0 && (
          <span className="text-xs text-muted-foreground ml-2">
            {doc.chunk_count} chunks
          </span>
        )}
      </div>
    </div>
  );
}

// Empty state component
function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <File className="h-8 w-8 text-muted-foreground/50" />
      </div>
      <p className="text-sm font-medium">No documents</p>
      <p className="text-xs text-muted-foreground text-center mt-1">
        Upload documents to get started
      </p>
    </div>
  );
}

// Error state component
function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4">
      <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
      </div>
      <p className="text-sm text-red-600 dark:text-red-400 text-center mb-3">
        {message}
      </p>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="h-4 w-4 mr-2" />
        Retry
      </Button>
    </div>
  );
}

// Loading state component
function LoadingState() {
  return (
    <div className="p-4 space-y-3">
      {[1, 2, 3].map((i) => (
        <SkeletonDocument key={i} />
      ))}
    </div>
  );
}

export function DocumentSidebar({ onDocumentChange }: DocumentSidebarProps) {
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const docs = await getDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (filename: string) => {
    setDeleting(filename);
    try {
      await deleteDocument(filename);
      setDocuments((prev) => prev.filter((doc) => doc.filename !== filename));
      onDocumentChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const handleReset = async () => {
    try {
      await resetDocuments();
      setDocuments([]);
      onDocumentChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset');
    }
  };

  const totalSize = documents.reduce((acc, doc) => acc + doc.file_size, 0);
  const indexedCount = documents.filter(doc => doc.processed).length;

  return (
    <Card className="overflow-hidden border-2 border-transparent shadow-soft h-full">
      <CardHeader className="bg-gradient-to-r from-card to-background border-b px-5 py-4">
        <CardTitle className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span>Documents</span>
            <CardDescription className="mt-0.5">
              {documents.length > 0
                ? `${documents.length} file${documents.length > 1 ? 's' : ''}`
                : 'Your knowledge base'}
            </CardDescription>
          </div>
        </CardTitle>
        {documents.length > 0 && (
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-border/50">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                <span>Indexed</span>
                <span>{indexedCount}/{documents.length}</span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-500"
                  style={{ width: `${(indexedCount / documents.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <LoadingState />
        ) : error && documents.length === 0 ? (
          <ErrorState message={error} onRetry={loadDocuments} />
        ) : documents.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex gap-2 p-4 border-b bg-muted/20">
              <Button
                variant="outline"
                size="sm"
                onClick={loadDocuments}
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <ScrollArea className="h-[calc(100vh-320px)]">
              <div className="p-4 space-y-3 stagger-children">
                {documents.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    doc={doc}
                    onDelete={() => handleDelete(doc.filename)}
                    isDeleting={deleting === doc.filename}
                  />
                ))}
              </div>
            </ScrollArea>
          </>
        )}
      </CardContent>
    </Card>
  );
}