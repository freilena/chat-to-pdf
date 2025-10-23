'use client';

import { UploadPanel } from "@/components/UploadPanel";
import { useSession } from "@/hooks/useSession";
import { useIndexingStatus } from "@/hooks/useIndexingStatus";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated, sessionId } = useSession();
  const { status: indexingStatus } = useIndexingStatus(sessionId);

  return (
    <div className="grid grid-2">
      <div>
        <UploadPanel />
      </div>
      <div>
        <div className="card" style={{ minHeight: 240 }}>
          <h3 style={{ marginTop: 0 }}>Chat</h3>
          {!isAuthenticated || !sessionId ? (
            <p className="muted">Upload and index PDFs to start chatting.</p>
          ) : !indexingStatus ? (
            <p className="muted">Upload and index PDFs to start chatting.</p>
          ) : indexingStatus.status === 'indexing' ? (
            <div>
              <p>Indexing your PDFs... This may take a moment.</p>
              <div className="muted">
                Processing {indexingStatus.files_indexed} of {indexingStatus.total_files} files
              </div>
            </div>
          ) : indexingStatus.status === 'error' ? (
            <div>
              <p className="error-message">Indexing failed. Please try uploading again.</p>
              <Link href="/chat" className="btn btn-primary">
                View Chat
              </Link>
            </div>
          ) : indexingStatus.status === 'done' ? (
            <div>
              <p>Your PDFs have been indexed and are ready for chat!</p>
              <Link href="/chat" className="btn btn-primary">
                Start Chatting
              </Link>
            </div>
          ) : (
            <p className="muted">Upload and index PDFs to start chatting.</p>
          )}
        </div>
      </div>
    </div>
  );
}
