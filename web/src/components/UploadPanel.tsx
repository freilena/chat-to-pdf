'use client';
import React from 'react';
import { useRouter } from 'next/navigation';

export function UploadPanel() {
  const router = useRouter();
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [isIndexing, setIsIndexing] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [filesIndexed, setFilesIndexed] = React.useState<number>(0);
  const [totalFiles, setTotalFiles] = React.useState<number>(0);
  const [error, setError] = React.useState<string | null>(null);
  const [isIndexingComplete, setIsIndexingComplete] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);

  async function onUpload() {
    if (!files || files.length === 0) return;
    setIsIndexing(true);
    setError(null);
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('files', f));
    const upRes = await fetch('/api/upload', { method: 'POST', body: form });
    if (!upRes.ok) {
      const msg = await upRes.text();
      setIsIndexing(false);
      setError(msg || 'Upload failed');
      return;
    }
    const upJson = await upRes.json();
    setSessionId(upJson.session_id);
    // Store session ID in localStorage immediately after successful upload
    localStorage.setItem('pdf-chat-session-id', upJson.session_id);
    // Dispatch custom event to notify other components
    window.dispatchEvent(new CustomEvent('sessionUpdated'));
    setFilesIndexed(0);
    setTotalFiles(upJson.totals?.files ?? (files?.length ?? 0));
    let tries = 0;
    while (tries < 5) {
      tries++;
      const stRes = await fetch(`/api/index/status?session_id=${upJson.session_id}`);
      const st = await stRes.json();
      if (typeof st.files_indexed === 'number') setFilesIndexed(st.files_indexed);
      if (typeof st.total_files === 'number') setTotalFiles(st.total_files);
      if (st.status === 'done') {
        setIsIndexingComplete(true);
        break;
      }
      await new Promise((r) => setTimeout(r, 10));
    }
    setIsIndexing(false);
  }

  const handleAskClick = () => {
    if (sessionId) {
      // Store session ID in localStorage for the chat page to use
      localStorage.setItem('pdf-chat-session-id', sessionId);
      router.push('/chat');
    }
  };

  return (
    <div className="card">
      {error && (
        <div role="alert" style={{ background: '#ffecec', color: '#a10000', padding: 8, borderRadius: 6, marginBottom: 12 }}>
          {error}
        </div>
      )}
      <div
        className={`upload-dropzone ${isDragging ? 'dragging' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          setFiles(e.dataTransfer.files);
        }}
      >
        <p className="upload-dropzone-text">
          📎 Drag & drop PDFs here
        </p>
        <p className="upload-dropzone-hint">
          or click to browse your files
        </p>
        <input
          id="pdf-upload-input"
          type="file"
          multiple
          accept="application/pdf"
          onChange={(e) => setFiles(e.target.files)}
          aria-label="pdf-input"
          className="upload-file-input"
        />
        <label htmlFor="pdf-upload-input" className="upload-file-label">
          Choose Files
        </label>
      </div>
      {files && files.length > 0 && (
        <ul className="file-list">
          {Array.from(files).map((f) => (
            <li key={f.name} className="file-list-item">
              <span className="file-name">📄 {f.name}</span>
              <span className="file-size">
                {(f.size / (1024 * 1024)).toFixed(2)} MB
              </span>
            </li>
          ))}
        </ul>
      )}
      <button className={`btn ${!isIndexing ? 'btn-primary' : ''}`} onClick={onUpload} disabled={!files || isIndexing} aria-label="upload-btn">
        {isIndexing ? 'Indexing…' : 'Upload'}
      </button>
      {isIndexing && (
        <div className="progress-container" aria-label="progress">
          <div className="progress-bar">
            <div 
              className="progress-bar-fill"
              style={{ width: `${totalFiles ? (filesIndexed / totalFiles) * 100 : 0}%` }}
            />
          </div>
          <div className="progress-text">
            Indexing {filesIndexed} of {totalFiles} files...
          </div>
        </div>
      )}
      {isIndexingComplete && sessionId && (
        <button 
          onClick={handleAskClick}
          className="btn btn-primary"
          aria-label="chat-btn"
        >
          Ask Questions
        </button>
      )}
    </div>
  );
}


