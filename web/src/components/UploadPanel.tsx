'use client';
import React from 'react';

export function UploadPanel() {
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [isIndexing, setIsIndexing] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | null>(null);

  async function onUpload() {
    if (!files || files.length === 0) return;
    setIsIndexing(true);
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('files', f));
    const upRes = await fetch('/api/upload', { method: 'POST', body: form });
    const upJson = await upRes.json();
    setSessionId(upJson.session_id);
    let tries = 0;
    while (tries < 5) {
      tries++;
      const stRes = await fetch(`/api/index/status?session_id=${upJson.session_id}`);
      const st = await stRes.json();
      if (st.status === 'done') break;
      await new Promise((r) => setTimeout(r, 10));
    }
    setIsIndexing(false);
  }

  return (
    <div>
      <input
        type="file"
        multiple
        accept="application/pdf"
        onChange={(e) => setFiles(e.target.files)}
        aria-label="pdf-input"
      />
      <button onClick={onUpload} disabled={!files || isIndexing} aria-label="upload-btn">
        {isIndexing ? 'Indexing…' : 'Upload'}
      </button>
      <button disabled={isIndexing} aria-label="chat-btn">Ask</button>
      {sessionId && <div aria-label="session-id">{sessionId}</div>}
    </div>
  );
}


