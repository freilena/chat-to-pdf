'use client';

import { useEffect, useState } from 'react';

interface VersionInfo {
  version: string;
  git_branch: string;
  git_commit: string;
  git_commit_full: string;
  git_commit_date: string;
  git_uncommitted_changes: boolean;
  environment: string;
}

export default function VersionBadge() {
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Only show in development
    if (process.env.NODE_ENV !== 'development') {
      setIsLoading(false);
      return;
    }

    // Fetch version from API
    fetch('http://localhost:8000/version')
      .then((res) => res.json())
      .then((data) => {
        setVersionInfo(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error('Failed to fetch version info:', err);
        setIsLoading(false);
      });
  }, []);

  // Don't show anything in production or while loading
  if (process.env.NODE_ENV !== 'development' || isLoading) {
    return null;
  }

  // Don't show if we couldn't fetch version
  if (!versionInfo) {
    return null;
  }

  const shortDisplay = `🔧 v${versionInfo.version} | ${versionInfo.git_branch}@${versionInfo.git_commit}${versionInfo.git_uncommitted_changes ? '*' : ''}`;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '12px',
        right: '12px',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        fontFamily: 'monospace',
        cursor: 'pointer',
        zIndex: 9999,
        maxWidth: showDetails ? '400px' : '350px',
        transition: 'all 0.2s ease',
      }}
      onClick={() => setShowDetails(!showDetails)}
      title="Click for details"
    >
      <div>{shortDisplay}</div>
      
      {showDetails && (
        <div
          style={{
            marginTop: '8px',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '11px',
          }}
        >
          <div><strong>Version:</strong> {versionInfo.version}</div>
          <div><strong>Branch:</strong> {versionInfo.git_branch}</div>
          <div><strong>Commit:</strong> {versionInfo.git_commit}</div>
          <div><strong>Full Hash:</strong> {versionInfo.git_commit_full.substring(0, 12)}...</div>
          <div><strong>Date:</strong> {new Date(versionInfo.git_commit_date).toLocaleString()}</div>
          <div>
            <strong>Status:</strong>{' '}
            {versionInfo.git_uncommitted_changes ? (
              <span style={{ color: '#ffcc00' }}>⚠️ Uncommitted changes</span>
            ) : (
              <span style={{ color: '#00ff00' }}>✓ Clean</span>
            )}
          </div>
          <div><strong>Environment:</strong> {versionInfo.environment}</div>
        </div>
      )}
    </div>
  );
}

