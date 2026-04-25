'use client';

import { useState, useRef } from 'react';
import { Upload, File, X, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth, getAuthHeaders } from '@/contexts/AuthContext';

interface PDFUploaderProps {
  onUploadComplete?: (url: string, filename: string) => void;
}

export default function PDFUploader({ onUploadComplete }: PDFUploaderProps) {
  const { getIdToken } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    setError(null);
    setUploaded(false);
    if (f.type !== 'application/pdf') {
      setError('Only PDF files are supported.');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError('File is too large (max 10MB).');
      return;
    }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) handleFile(dropped);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const headers = await getAuthHeaders(getIdToken);
      if (!headers) throw new Error('Not authenticated');
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', { method: 'POST', headers, body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Upload failed');
      }
      const { downloadUrl, filename } = await res.json();
      setUploaded(true);
      onUploadComplete?.(downloadUrl, filename);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-3" role="region" aria-label="PDF uploader">
      <div
        className="relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all"
        style={{
          borderColor: isDragging ? 'var(--np-purple)' : 'var(--border-default)',
          background: isDragging ? '#EDE9FE' : 'var(--bg-elevated)',
        }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !file && inputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Drop PDF here or click to browse"
        onKeyDown={(e) => e.key === 'Enter' && !file && inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="sr-only"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          aria-label="Select PDF file"
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <File size={24} style={{ color: 'var(--np-purple)' }} aria-hidden="true" />
            <span className="text-sm font-medium truncate max-w-[200px]" style={{ color: 'var(--text-primary)' }}>
              {file.name}
            </span>
            <button
              onClick={(e) => { e.stopPropagation(); setFile(null); setUploaded(false); }}
              className="p-1 rounded-full transition-colors"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Remove selected file"
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <Upload size={28} className="mx-auto" style={{ color: 'var(--text-muted)' }} aria-hidden="true" />
            <div className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              <span className="font-medium" style={{ color: 'var(--np-purple)' }}>Upload a PDF</span>{' '}
              or drag and drop
            </div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Max 10MB</div>
          </div>
        )}
      </div>

      {error && (
        <div
          role="alert"
          className="text-xs rounded-lg px-3 py-2"
          style={{ color: '#dc2626', background: '#FEE2E2', border: '1px solid #FECACA' }}
        >
          {error}
        </div>
      )}

      {file && !uploaded && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className="btn-primary w-full justify-center py-3 text-sm"
          aria-label="Upload selected PDF file"
        >
          {uploading ? (
            <><Loader2 size={16} className="animate-spin" aria-hidden="true" /> Uploading…</>
          ) : (
            <><Upload size={16} aria-hidden="true" /> Upload to NeuralPath</>
          )}
        </button>
      )}

      {uploaded && (
        <div
          className="flex items-center gap-2 text-sm rounded-lg px-4 py-3"
          style={{ color: '#0d9488', background: '#CCFBF1', border: '1px solid #5EEAD4' }}
          role="status"
        >
          <CheckCircle2 size={16} aria-hidden="true" />
          Uploaded! NeuralPath can now learn from this document.
        </div>
      )}
    </div>
  );
}
