import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
// Intentionally import component that does not exist yet per TDD
import { UploadPanel } from '@/components/UploadPanel';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
}));

describe('UploadPanel', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('disables chat during indexing and enables after completion', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ session_id: 's123', totals: { files: 1, bytes: 7 } }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ status: 'indexing', total_files: 1, files_indexed: 0 }),
          { status: 200 },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ status: 'done', total_files: 1, files_indexed: 1 }),
          { status: 200 },
        ),
      );
    (globalThis as unknown as { fetch: typeof fetch }).fetch = fetchMock;

    render(<UploadPanel />);

    const input = screen.getByLabelText('pdf-input') as HTMLInputElement;
    const file = new File([new Blob(['%PDF-1.4'])], 'a.pdf', { type: 'application/pdf' });
    Object.defineProperty(input, 'files', { value: { 0: file, length: 1, item: () => file } });
    // Fire change to simulate user selecting files
    fireEvent.change(input);

    const uploadBtn = screen.getByLabelText('upload-btn');

    fireEvent.click(uploadBtn);

    // Shows progress indicator during indexing
    await waitFor(() => expect(screen.getByLabelText('progress')).toHaveTextContent('Indexing'));
    // Session ID is stored internally but not displayed in UI
    
    // After indexing completes, "Ask Questions" button should appear (not disabled)
    await waitFor(() => {
      const chatBtn = screen.getByLabelText('chat-btn') as HTMLButtonElement;
      expect(chatBtn).toBeInTheDocument();
      expect(chatBtn).not.toBeDisabled();
      expect(chatBtn).toHaveTextContent('Ask Questions');
    });
  });
});


