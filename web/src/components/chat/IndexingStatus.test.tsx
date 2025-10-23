import React from 'react';
import { render, screen } from '@testing-library/react';
import { IndexingStatus } from './IndexingStatus';
import { IndexingStatus as IndexingStatusType } from '@/hooks/useIndexingStatus';

describe('IndexingStatus', () => {
  it('renders nothing when status is done', () => {
    const status: IndexingStatusType = {
      status: 'done',
      total_files: 3,
      files_indexed: 3,
    };

    const { container } = render(<IndexingStatus status={status} progress={100} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders indexing status correctly', () => {
    const status: IndexingStatusType = {
      status: 'indexing',
      total_files: 3,
      files_indexed: 1,
    };

    render(<IndexingStatus status={status} progress={33} />);

    expect(screen.getByText('Indexing Documents')).toBeInTheDocument();
    expect(screen.getByText('Processing 1 of 3 files...')).toBeInTheDocument();
    expect(screen.getByText('33%')).toBeInTheDocument();
  });

  it('renders error status correctly', () => {
    const status: IndexingStatusType = {
      status: 'error',
      total_files: 3,
      files_indexed: 1,
      error: 'Processing failed',
    };

    render(<IndexingStatus status={status} progress={33} />);

    expect(screen.getByText('Indexing Failed')).toBeInTheDocument();
    expect(screen.getByText('There was an error processing your files. Please try uploading again.')).toBeInTheDocument();
  });

  it('has proper accessibility attributes for indexing', () => {
    const status: IndexingStatusType = {
      status: 'indexing',
      total_files: 3,
      files_indexed: 1,
    };

    render(<IndexingStatus status={status} progress={33} />);

    const statusElement = screen.getByRole('status');
    expect(statusElement).toHaveAttribute('aria-live', 'polite');

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow', '33');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-label', 'Indexing progress: 33%');
  });

  it('has proper accessibility attributes for error', () => {
    const status: IndexingStatusType = {
      status: 'error',
      total_files: 3,
      files_indexed: 1,
    };

    render(<IndexingStatus status={status} progress={33} />);

    const alertElement = screen.getByRole('alert');
    expect(alertElement).toHaveAttribute('aria-live', 'polite');
  });

  it('displays correct progress percentage', () => {
    const status: IndexingStatusType = {
      status: 'indexing',
      total_files: 5,
      files_indexed: 2,
    };

    render(<IndexingStatus status={status} progress={40} />);

    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  it('displays correct file counts', () => {
    const status: IndexingStatusType = {
      status: 'indexing',
      total_files: 10,
      files_indexed: 7,
    };

    render(<IndexingStatus status={status} progress={70} />);

    expect(screen.getByText('Processing 7 of 10 files...')).toBeInTheDocument();
  });

  it('handles zero files gracefully', () => {
    const status: IndexingStatusType = {
      status: 'indexing',
      total_files: 0,
      files_indexed: 0,
    };

    render(<IndexingStatus status={status} progress={0} />);

    expect(screen.getByText('Processing 0 of 0 files...')).toBeInTheDocument();
    expect(screen.getByText('0%')).toBeInTheDocument();
  });
});
