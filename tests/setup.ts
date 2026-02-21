/**
 * tests/setup.ts
 * --------------
 * Global test setup file — runs once before every test file.
 *
 * Responsibilities:
 *   1. Extend Vitest's `expect` with @testing-library/jest-dom matchers
 *      (toBeInTheDocument, toHaveValue, toBeVisible, etc.).
 *   2. Mock localStorage with a simple in-memory implementation so tests
 *      that use useLocalStorage don't touch the real browser storage.
 *   3. Suppress noisy console output from React during tests (optional).
 */

import '@testing-library/jest-dom';

// ── localStorage Mock ─────────────────────────────────────────────────────────
// jsdom provides a real localStorage stub, but we reset it between tests
// to prevent state from leaking across test files.

beforeEach(() => {
  localStorage.clear();
});

// ── Silence React act() warnings in test output ───────────────────────────────
// Comment this out if you want to see the warnings during debugging.
const originalError = console.error.bind(console);
beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (
      msg.includes('Warning: An update to') ||
      msg.includes('Warning: act(') ||
      msg.includes('Warning: ReactDOM.render is no longer supported')
    ) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
