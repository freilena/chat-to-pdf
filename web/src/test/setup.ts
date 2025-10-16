import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';

(() => {
  if (typeof (globalThis as any).File === 'undefined') {
    class PolyFile extends Blob {
      name: string;
      lastModified: number;
      constructor(bits: BlobPart[], name: string, options: FilePropertyBag = {}) {
        super(bits, options);
        this.name = name.replace(/\\/g, '/');
        this.lastModified = options.lastModified ?? Date.now();
      }
    }
    (globalThis as any).File = PolyFile as unknown as typeof File;
  }
})();

export const server = setupServer(
  // Mock API routes
  http.get('http://localhost:3000/api/index/status', () => {
    return HttpResponse.json({
      status: 'done',
      total_files: 1,
      files_indexed: 1,
    });
  }),
  http.post('http://localhost:3000/api/upload', () => {
    return HttpResponse.json({
      session_id: 'test-session-123',
      totals: { files: 1, bytes: 1024 },
    });
  }),
);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());


