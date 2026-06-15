'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  File,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  Image,
  Table,
  FileJson,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonCard } from '@/components/ui/skeleton';
import {
  uploadFiles,
  processDocuments,
  DocumentInfo,
} from '@/lib/api';
import { cn } from '@/lib/utils';

interface FileUploaderProps {
  onFilesUploaded: (files: DocumentInfo[]) => void;
  onProcessComplete: () => void;
}

// File type icons
const getFileIcon = (type: string) => {
  if (type.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
  if (type.includes('image')) return <Image className="h-5 w-5 text-blue-500" />;
  if (type.includes('spreadsheet') || type.includes('excel')) return <Table className="h-5 w-5 text-green-500" />;
  if (type.includes('json')) return <FileJson className="h-5 w-5 text-yellow-500" />;
  return <File className="h-5 w-5 text-muted-foreground" />;
};

// Format file size
const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// File item component
function FileItem({
  file,
  onRemove,
  index,
}: {
  file: File;
  onRemove: () => void;
  index: number;
}) {
  return (
    <div
      className="flex items-center justify-between bg-muted/50 dark:bg-muted/30 rounded-lg px-3 py-2.5 group animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-9 w-9 rounded-lg bg-background flex items-center justify-center border">
          {getFileIcon(file.type)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {formatFileSize(file.size)}
          </p>
        </div>
      </div>
      <button
        onClick={onRemove}
        className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-destructive/10 rounded-lg transition-all"
      >
        <X className="h-4 w-4 text-destructive" />
      </button>
    </div>
  );
}

// Uploaded document component
function UploadedDocument({
  doc,
  index,
}: {
  doc: DocumentInfo;
  index: number;
}) {
  return (
    <div
      className="flex items-center justify-between bg-green-50/50 dark:bg-green-900/10 rounded-lg px-3 py-2.5 border border-green-500/20 animate-fade-in-up"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="h-9 w-9 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium truncate">{doc.filename}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Badge variant="outline" className="text-[10px] bg-green-500/5">
              {doc.source_type}
            </Badge>
            {doc.chunk_count && (
              <span className="text-xs text-green-600 dark:text-green-400">
                {doc.chunk_count} chunks
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Processing component
function ProcessingState() {
  return (
    <div className="flex flex-col items-center justify-center py-8 animate-pulse-soft">
      <Loader2 className="h-10 w-10 text-primary animate-spin mb-4" />
      <p className="text-sm font-medium">Processing documents...</p>
      <p className="text-xs text-muted-foreground mt-1">
        This may take a few moments
      </p>
    </div>
  );
}

// Success state component
function SuccessState({
  docs,
  chunks,
}: {
  docs: number;
  chunks: number;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 animate-scale-in">
      <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
        <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
      </div>
      <p className="text-lg font-semibold text-green-600 dark:text-green-400">
        Processing Complete!
      </p>
      <div className="flex items-center gap-4 mt-2">
        <div className="text-center">
          <p className="text-2xl font-bold">{docs}</p>
          <p className="text-xs text-muted-foreground">Documents</p>
        </div>
        <div className="h-8 w-px bg-border" />
        <div className="text-center">
          <p className="text-2xl font-bold">{chunks}</p>
          <p className="text-xs text-muted-foreground">Chunks</p>
        </div>
      </div>
    </div>
  );
}

// Error state component
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-6 animate-fade-in">
      <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-3">
        <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
      </div>
      <p className="text-sm text-red-600 dark:text-red-400 text-center mb-3">
        {message}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

export function FileUploader({
  onFilesUploaded,
  onProcessComplete,
}: FileUploaderProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<DocumentInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [processResult, setProcessResult] = useState<{
    docs: number;
    chunks: number;
  } | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
    setError(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      const docs = await uploadFiles(files);
      setUploadedDocs(docs);
      onFilesUploaded(docs);
      setFiles([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  const handleProcess = async () => {
    setProcessing(true);
    setError(null);
    setProcessResult(null);

    try {
      const result = await processDocuments();
      setProcessResult({
        docs: result.documents_processed,
        chunks: result.chunks_created,
      });
      onProcessComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process documents');
    } finally {
      setProcessing(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
        '.xlsx',
      ],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        ['.docx'],
      'application/json': ['.json'],
    },
  });

  return (
    <Card className="overflow-hidden border-2 border-transparent shadow-soft">
      <CardHeader className="bg-gradient-to-r from-card to-background border-b px-6 py-4">
        <CardTitle className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
            <Upload className="h-5 w-5 text-primary" />
          </div>
          <div>
            <span>Upload Documents</span>
            <CardDescription className="mt-0.5">
              Add files to your knowledge base
            </CardDescription>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 p-6">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={cn(
            'relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300',
            isDragActive
              ? 'border-primary bg-primary/5 scale-[1.01]'
              : 'border-border hover:border-primary/50 hover:bg-muted/30'
          )}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-3">
            <div
              className={cn(
                'h-14 w-14 rounded-xl flex items-center justify-center transition-colors',
                isDragActive
                  ? 'bg-primary/20'
                  : 'bg-muted/50'
              )}
            >
              <Upload
                className={cn(
                  'h-7 w-7 transition-colors',
                  isDragActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
            </div>
            <div>
              {isDragActive ? (
                <p className="text-primary font-medium">Drop files here...</p>
              ) : (
                <>
                  <p className="text-sm font-medium">
                    Drag & drop files here, or click to select
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supports: PDF, TXT, CSV, XLSX, DOCX, JSON
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Selected Files ({files.length})</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiles([])}
                className="text-muted-foreground"
              >
                Clear all
              </Button>
            </div>
            <div className="space-y-2 stagger-children">
              {files.map((file, index) => (
                <FileItem
                  key={index}
                  file={file}
                  index={index}
                  onRemove={() => removeFile(index)}
                />
              ))}
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              loading={uploading}
              loadingText="Uploading..."
              className="w-full"
              size="lg"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload {files.length} File{files.length > 1 ? 's' : ''}
            </Button>
          </div>
        )}

        {/* Uploaded documents */}
        {uploadedDocs.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium">Uploaded Documents</p>
            <div className="space-y-2 stagger-children">
              {uploadedDocs.map((doc, index) => (
                <UploadedDocument key={index} doc={doc} index={index} />
              ))}
            </div>
            {processing ? (
              <ProcessingState />
            ) : !processResult ? (
              <Button
                onClick={handleProcess}
                disabled={processing}
                className="w-full"
                size="lg"
                variant="gradient"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Process Documents
              </Button>
            ) : null}
          </div>
        )}

        {/* Process result */}
        {processResult && (
          <SuccessState
            docs={processResult.docs}
            chunks={processResult.chunks}
          />
        )}

        {/* Error */}
        {error && <ErrorState message={error} onRetry={files.length > 0 ? handleUpload : handleProcess} />}
      </CardContent>
    </Card>
  );
}