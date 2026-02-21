/**
 * tests/hooks/useSearch.test.ts
 * ------------------------------
 * Tests for hooks/useSearch.ts
 *
 * Testing approach:
 *   - Uses vi.useFakeTimers() to control the debounce delay precisely.
 *   - Verifies that debouncedQuery does NOT update before the delay elapses.
 *   - Verifies that debouncedQuery DOES update after the delay.
 *   - Verifies clearSearch resets both values immediately (no timer needed).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSearch } from '@/hooks/useSearch';

describe('useSearch', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  // ── Initial State ──────────────────────────────────────────────────────────

  it('initialises query and debouncedQuery with the initial value', () => {
    const { result } = renderHook(() => useSearch('hello'));
    expect(result.current.query).toBe('hello');
    expect(result.current.debouncedQuery).toBe('hello');
  });

  it('defaults initial values to empty strings', () => {
    const { result } = renderHook(() => useSearch());
    expect(result.current.query).toBe('');
    expect(result.current.debouncedQuery).toBe('');
  });

  // ── Debounce Behaviour ─────────────────────────────────────────────────────

  it('updates query immediately when setQuery is called', () => {
    const { result } = renderHook(() => useSearch('', 300));
    act(() => { result.current.setQuery('immediate'); });
    expect(result.current.query).toBe('immediate');
  });

  it('does NOT update debouncedQuery before the delay elapses', () => {
    const { result } = renderHook(() => useSearch('', 300));
    act(() => { result.current.setQuery('typing…'); });

    // Advance time by less than the debounce delay
    act(() => { vi.advanceTimersByTime(299); });

    expect(result.current.debouncedQuery).toBe('');
  });

  it('updates debouncedQuery after the full delay has elapsed', () => {
    const { result } = renderHook(() => useSearch('', 300));
    act(() => { result.current.setQuery('final value'); });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.debouncedQuery).toBe('final value');
  });

  it('uses only the latest value when setQuery is called multiple times rapidly', () => {
    const { result } = renderHook(() => useSearch('', 300));
    act(() => { result.current.setQuery('a'); });
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { result.current.setQuery('ab'); });
    act(() => { vi.advanceTimersByTime(100); });
    act(() => { result.current.setQuery('abc'); });
    // Advance past the full delay from the last keystroke
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current.debouncedQuery).toBe('abc');
  });

  // ── clearSearch ────────────────────────────────────────────────────────────

  it('clears both query and debouncedQuery immediately', () => {
    const { result } = renderHook(() => useSearch('initial', 300));
    act(() => { result.current.clearSearch(); });
    expect(result.current.query).toBe('');
    expect(result.current.debouncedQuery).toBe('');
  });

  it('cancels a pending debounce timer when clearSearch is called', () => {
    const { result } = renderHook(() => useSearch('', 300));
    act(() => { result.current.setQuery('pending'); });
    act(() => { result.current.clearSearch(); }); // cancel before delay fires
    act(() => { vi.advanceTimersByTime(300); });   // timer fires but should be cancelled
    // debouncedQuery should remain '' because clearSearch cancelled the timer
    expect(result.current.debouncedQuery).toBe('');
  });

  // ── Custom Delay ───────────────────────────────────────────────────────────

  it('respects a custom delay value', () => {
    const CUSTOM_DELAY = 1000;
    const { result } = renderHook(() => useSearch('', CUSTOM_DELAY));
    act(() => { result.current.setQuery('slow'); });
    act(() => { vi.advanceTimersByTime(999); });
    expect(result.current.debouncedQuery).toBe('');
    act(() => { vi.advanceTimersByTime(1); });
    expect(result.current.debouncedQuery).toBe('slow');
  });
});
