import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';

(() => {
  if (typeof (globalThis as unknown as { File: typeof File }).File === 'undefined') {
    class PolyFile extends Blob {
      name: string;
      lastModified: number;
      constructor(bits: BlobPart[], name: string, options: FilePropertyBag = {}) {
        super(bits, options);
        this.name = name.replace(/\\/g, '/');
        this.lastModified = options.lastModified ?? Date.now();
      }
    }
    (globalThis as unknown as { File: typeof File }).File = PolyFile as unknown as typeof File;
  }
})();

export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Suppress console errors during tests to avoid noise in CI
// Tests that intentionally trigger errors will still pass
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    // Only suppress expected error messages from our code
    const message = args[0]?.toString() || '';
    if (
      message.includes('Query submission failed') ||
      message.includes('Failed to fetch indexing status') ||
      message.includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
  
  console.warn = (...args: unknown[]) => {
    // Suppress common React warnings in tests
    const message = args[0]?.toString() || '';
    if (message.includes('Warning:') || message.includes('act(')) {
      return;
    }
    originalWarn.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
  console.warn = originalWarn;
});


