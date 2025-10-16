import '@testing-library/jest-dom';
import { setupServer } from 'msw/node';

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

export const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());


