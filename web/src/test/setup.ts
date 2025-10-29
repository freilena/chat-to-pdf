import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';
import { vi } from 'vitest';

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

beforeAll(() => {
  server.listen({ onUnhandledRequest: 'warn' }); // Use 'warn' instead of 'error' to prevent hanging
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(async () => {
  server.close();
  // Give MSW time to cleanup
  await new Promise(resolve => setTimeout(resolve, 100));
});


