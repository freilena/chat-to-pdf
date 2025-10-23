'use client';

import { UploadPanel } from "@/components/UploadPanel";
import { useSession } from "@/hooks/useSession";
import Link from "next/link";

export default function Home() {
  const { isAuthenticated, sessionId } = useSession();

  return (
    <div className="grid grid-2">
      <div>
        <UploadPanel />
      </div>
      <div>
        <div className="card" style={{ minHeight: 240 }}>
          <h3 style={{ marginTop: 0 }}>Chat</h3>
          {isAuthenticated && sessionId ? (
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
