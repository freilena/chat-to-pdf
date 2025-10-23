import React from 'react';
import { IndexingStatus as IndexingStatusType } from '@/hooks/useIndexingStatus';

interface IndexingStatusProps {
  status: IndexingStatusType;
  progress: number;
}

export function IndexingStatus({ status, progress }: IndexingStatusProps) {
  const { status: indexingStatus, total_files, files_indexed } = status;

  if (indexingStatus === 'done') {
    return null; // Don't show anything when complete
  }

  if (indexingStatus === 'error') {
    return (
      <div className="indexing-status error" role="alert" aria-live="polite">
        <div className="indexing-content">
          <div className="indexing-icon">⚠️</div>
          <div className="indexing-text">
            <div className="indexing-title">Indexing Failed</div>
            <div className="indexing-description">
              There was an error processing your files. Please try uploading again.
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="indexing-status" role="status" aria-live="polite">
      <div className="indexing-content">
        <div className="indexing-icon">📄</div>
        <div className="indexing-text">
          <div className="indexing-title">Indexing Documents</div>
          <div className="indexing-description">
            Processing {files_indexed} of {total_files} files...
          </div>
        </div>
      </div>
      
      <div className="indexing-progress">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${progress}%` }}
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            role="progressbar"
            aria-label={`Indexing progress: ${progress}%`}
          />
        </div>
        <div className="progress-text">{progress}%</div>
      </div>
    </div>
  );
}
