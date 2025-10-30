import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    css: true,
    testTimeout: 10000, // 10 second timeout per test
    hookTimeout: 10000, // 10 second timeout for hooks
    teardownTimeout: 5000, // 5 second timeout for teardown
  },
  resolve: {
    alias: {
      '@/': path.resolve(__dirname, './src/') + '/',
    },
  },
});
