'use client';
import React from 'react';

export function UploadPanel() {
  const [files, setFiles] = React.useState<FileList | null>(null);
  const [isIndexing, setIsIndexing] = React.useState(false);
  const [sessionId, setSessionId] = React.useState<string | null>(null);
  const [filesIndexed, setFilesIndexed] = React.useState<number>(0);
  const [totalFiles, setTotalFiles] = React.useState<number>(0);

  async function onUpload() {
    if (!files || files.length === 0) return;
    setIsIndexing(true);
    const form = new FormData();
    Array.from(files).forEach((f) => form.append('files', f));
    const upRes = await fetch('/api/upload', { method: 'POST', body: form });
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
      {isIndexing && (
        <div aria-label="progress">{`Indexing ${filesIndexed}/${totalFiles}`}</div>
      )}
      <button disabled={isIndexing} aria-label="chat-btn">Ask</button>
      {sessionId && <div aria-label="session-id">{sessionId}</div>}
    </div>
  );
}


