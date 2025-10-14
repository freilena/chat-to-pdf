import { UploadPanel } from "@/components/UploadPanel";

export default function Home() {
  return (
    <div className="grid grid-2">
      <div>
        <UploadPanel />
      </div>
      <div>
        <div className="card" style={{ minHeight: 240 }}>
          <h3 style={{ marginTop: 0 }}>Chat</h3>
          <p className="muted">Chat will be enabled after indexing completes.</p>
        </div>
      </div>
    </div>
  );
}
