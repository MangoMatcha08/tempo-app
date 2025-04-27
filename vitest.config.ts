
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    testTimeout: 20000, // Increase default timeout to 20 seconds
  },
});
