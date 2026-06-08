'use client';

import { useEffect, useState } from 'react';
import { File, Trash2, RefreshCw, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import {
  getDocuments,
  deleteDocument,
  resetDocuments,
  DocumentInfo,
} from '@/lib/api';

interface DocumentSidebarProps {
  onDocumentChange: () => void;
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
    try {
      const docs = await getDocuments();
      setDocuments(docs);
      setError(null);
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex-shrink-0">
        <CardTitle className="flex items-center gap-2 text-lg">
          <File className="h-5 w-5" />
          Documents
        </CardTitle>
        {documents.length > 0 && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadDocuments}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="text-red-500 hover:text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 p-0">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner />
          </div>
        ) : error ? (
          <div className="p-4 text-center">
            <AlertCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
            <p className="text-sm text-red-500">{error}</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            <File className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No documents uploaded</p>
          </div>
        ) : (
          <ScrollArea className="h-[calc(100vh-280px)]">
            <div className="p-4 space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="bg-muted rounded-lg p-3 group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm truncate">
                        {doc.filename}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px]">
                          {doc.source_type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(doc.upload_timestamp)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleDelete(doc.filename)}
                      disabled={deleting === doc.filename}
                    >
                      {deleting === doc.filename ? (
                        <Spinner className="h-4 w-4" />
                      ) : (
                        <Trash2 className="h-4 w-4 text-red-500" />
                      )}
                    </Button>
                  </div>
                  <div className="mt-2">
                    <Badge
                      variant={doc.processed ? 'success' : 'secondary'}
                      className="text-[10px]"
                    >
                      {doc.processed ? 'Indexed' : 'Pending'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}