'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import {
  uploadFiles,
  processDocuments,
  DocumentInfo,
} from '@/lib/api';

interface FileUploaderProps {
  onFilesUploaded: (files: DocumentInfo[]) => void;
  onProcessComplete: () => void;
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Documents
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-primary bg-primary/5'
              : 'border-border hover:border-primary/50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            {isDragActive ? (
              <p className="text-sm text-primary">Drop files here...</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Drag & drop files here, or click to select
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Supports: PDF, TXT, CSV, XLSX, DOCX, JSON
            </p>
          </div>
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Selected Files:</p>
            <div className="space-y-1">
              {files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-muted rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <File className="h-4 w-4 flex-shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      ({formatFileSize(file.size)})
                    </span>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Spinner className="mr-2" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload {files.length} File{files.length > 1 ? 's' : ''}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Uploaded documents */}
        {uploadedDocs.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Uploaded Documents:</p>
            <div className="space-y-1">
              {uploadedDocs.map((doc, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-md px-3 py-2"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span className="text-sm truncate">{doc.filename}</span>
                  </div>
                  <Badge variant="secondary">{doc.source_type}</Badge>
                </div>
              ))}
            </div>
            <Button
              onClick={handleProcess}
              disabled={processing}
              className="w-full"
            >
              {processing ? (
                <>
                  <Spinner className="mr-2" />
                  Processing...
                </>
              ) : (
                'Process Documents'
              )}
            </Button>
          </div>
        )}

        {/* Process result */}
        {processResult && (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 text-center">
            <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <p className="text-sm font-medium">
              Successfully processed {processResult.docs} document(s) with{' '}
              {processResult.chunks} chunks
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}