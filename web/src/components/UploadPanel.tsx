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
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          setFiles(e.dataTransfer.files);
        }}
        style={{
          border: '2px dashed #ccc',
          background: '#fff',
          padding: 16,
          borderRadius: 8,
          marginBottom: 12,
        }}
      >
        <p style={{ margin: 0, color: '#555' }}>Drag & drop PDFs here, or choose files</p>
        <input
          type="file"
          multiple
          accept="application/pdf"
          onChange={(e) => setFiles(e.target.files)}
          aria-label="pdf-input"
          style={{ display: 'block', marginTop: 8 }}
        />
      </div>
      {files && files.length > 0 && (
        <ul style={{ padding: 0, listStyle: 'none', marginBottom: 12 }}>
          {Array.from(files).map((f) => (
            <li key={f.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', borderBottom: '1px solid #eee' }}>
              <span>{f.name}</span>
              <span style={{ color: '#888' }}>{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
            </li>
          ))}
        </ul>
      )}
      <button className={`btn ${!isIndexing ? 'btn-primary' : ''}`} onClick={onUpload} disabled={!files || isIndexing} aria-label="upload-btn">
        {isIndexing ? 'Indexing…' : 'Upload'}
      </button>
      {isIndexing && (
        <div aria-label="progress" style={{ marginTop: 8 }}>
          <div style={{ height: 6, background: '#eee', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: `${totalFiles ? (filesIndexed / totalFiles) * 100 : 0}%`, height: '100%', background: '#111' }} />
          </div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{`Indexing ${filesIndexed}/${totalFiles}`}</div>
        </div>
      )}
      <button 
        onClick={handleAskClick}
        disabled={!isIndexingComplete || !sessionId} 
        className={isIndexingComplete && sessionId ? 'btn btn-primary' : 'btn'}
        aria-label="chat-btn"
      >
        {isIndexingComplete ? 'Ask Questions' : 'Ask'}
      </button>
      {sessionId && <div aria-label="session-id">{sessionId}</div>}
    </div>
  );
}


