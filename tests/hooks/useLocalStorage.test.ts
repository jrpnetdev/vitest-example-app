/**
 * tests/hooks/useLocalStorage.test.ts
 * -------------------------------------
 * Tests for hooks/useLocalStorage.ts
 *
 * Testing approach:
 *   - renderHook() from @testing-library/react provides a clean hook lifecycle.
 *   - act() wraps all state mutations so React processes them synchronously.
 *   - localStorage is cleared between tests via the global setup in tests/setup.ts.
 *   - Error resilience: corrupt JSON, quota-exceeded (mocked), missing key.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

// ── Basic Read / Write ────────────────────────────────────────────────────────

describe('useLocalStorage — basic behaviour', () => {
  it('returns the default value when localStorage is empty', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'default'));
    const [value] = result.current;
    expect(value).toBe('default');
  });

  it('updates the stored value when setValue is called', () => {
    const { result } = renderHook(() => useLocalStorage('key', 'initial'));
    act(() => { result.current[1]('updated'); });
    const [value] = result.current;
    expect(value).toBe('updated');
  });

  it('persists the value in localStorage', () => {
    const { result } = renderHook(() => useLocalStorage('persist_key', 0));
    act(() => { result.current[1](42); });
    expect(JSON.parse(localStorage.getItem('persist_key')!)).toBe(42);
  });

  it('reads an existing localStorage value on mount', () => {
    localStorage.setItem('existing_key', JSON.stringify({ count: 5 }));
    const { result } = renderHook(() => useLocalStorage('existing_key', { count: 0 }));
    expect(result.current[0]).toEqual({ count: 5 });
  });
});

// ── Updater Function ──────────────────────────────────────────────────────────

describe('useLocalStorage — updater function', () => {
  it('accepts an updater function (mirrors useState)', () => {
    const { result } = renderHook(() => useLocalStorage('counter', 0));
    act(() => { result.current[1]((prev) => prev + 1); });
    act(() => { result.current[1]((prev) => prev + 1); });
    expect(result.current[0]).toBe(2);
  });
});

// ── Remove ────────────────────────────────────────────────────────────────────

describe('useLocalStorage — remove', () => {
  it('removes the item from localStorage when remove is called', () => {
    localStorage.setItem('rm_key', JSON.stringify('hello'));
    const { result } = renderHook(() => useLocalStorage('rm_key', ''));
    act(() => { result.current[2](); }); // call remove
    expect(localStorage.getItem('rm_key')).toBeNull();
  });

  it('resets the state to the default value after remove', () => {
    const { result } = renderHook(() => useLocalStorage('rm_key2', 'default'));
    act(() => { result.current[1]('changed'); });
    act(() => { result.current[2](); });
    expect(result.current[0]).toBe('default');
  });
});

// ── Error Resilience ──────────────────────────────────────────────────────────

describe('useLocalStorage — error resilience', () => {
  it('returns the default value when localStorage contains corrupt JSON', () => {
    // Write invalid JSON directly to bypass JSON.parse
    localStorage.setItem('bad_json', 'THIS_IS_NOT_JSON{');
    const { result } = renderHook(() => useLocalStorage('bad_json', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('does not throw when localStorage.setItem throws (quota exceeded)', () => {
    const setItemMock = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    const { result } = renderHook(() => useLocalStorage('quota_key', 0));
    // Should not throw — silently handles the quota error
    expect(() => {
      act(() => { result.current[1](999); });
    }).not.toThrow();

    setItemMock.mockRestore();
  });
});

// ── Complex Types ─────────────────────────────────────────────────────────────

describe('useLocalStorage — complex types', () => {
  it('round-trips an array correctly', () => {
    const { result } = renderHook(() => useLocalStorage<number[]>('arr', []));
    act(() => { result.current[1]([1, 2, 3]); });
    expect(result.current[0]).toEqual([1, 2, 3]);
  });

  it('round-trips a nested object correctly', () => {
    const initial = { user: { name: 'Alice', age: 30 } };
    const { result } = renderHook(() => useLocalStorage('obj', initial));
    act(() => { result.current[1]({ user: { name: 'Bob', age: 25 } }); });
    expect(result.current[0]).toEqual({ user: { name: 'Bob', age: 25 } });
  });
});
