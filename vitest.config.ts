import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

/**
 * Vitest Configuration
 *
 * This configuration sets up the test environment for the TaskFlow application.
 * It uses jsdom to simulate a browser environment, enabling React component testing.
 * The path alias '@/*' mirrors the TypeScript paths in tsconfig.json.
 */
export default defineConfig({
  plugins: [react()],
  test: {
    // Use jsdom to simulate browser APIs (DOM, localStorage, fetch, etc.)
    environment: 'jsdom',

    // Run the global setup file before all tests — imports jest-dom matchers
    setupFiles: ['./tests/setup.ts'],

    // Make Vitest globals (describe, it, expect, etc.) available without importing
    globals: true,

    // Coverage configuration — tracks which source lines are exercised by tests
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'app/layout.tsx',   // Layout is a thin wrapper; covered by integration tests
        'app/globals.css',
      ],
      // Thresholds enforce a minimum coverage floor for the entire project
      thresholds: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    // Mirror the '@/*' path alias used throughout the app source
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
});
