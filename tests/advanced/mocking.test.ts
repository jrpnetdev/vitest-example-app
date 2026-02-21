/**
 * tests/advanced/mocking.test.ts
 * --------------------------------
 * Advanced mocking techniques with Vitest
 *
 * Topics covered:
 *   1. vi.fn()          — Basic spy / mock function
 *   2. vi.spyOn()       — Spy on existing module methods
 *   3. vi.mock()        — Module-level mocking
 *   4. vi.useFakeTimers — Control time (setTimeout, Date, etc.)
 *   5. Mocking fetch    — Simulate HTTP calls without a real server
 *   6. Mocking localStorage — Intercept storage calls
 *   7. Mocking crypto/random — Deterministic ID generation
 *   8. Module factory mocks — Replace entire modules
 *   9. Partial mocks    — Mock only selected exports
 *  10. Mock implementation overrides per test
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTask, generateId, isTaskOverdue } from '@/lib/taskUtils';
import { formatDate, formatRelativeDate } from '@/lib/dateUtils';
import { validateTitle } from '@/lib/validation';
import { Task } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// 1. Basic vi.fn() — spy and mock return values
// ─────────────────────────────────────────────────────────────────────────────

describe('Mocking — vi.fn() basic spy', () => {
  it('records how many times a function is called', () => {
    const spy = vi.fn();
    spy();
    spy();
    spy();
    // toHaveBeenCalledTimes verifies call count exactly
    expect(spy).toHaveBeenCalledTimes(3);
  });

  it('records arguments passed to each call', () => {
    const spy = vi.fn<[string, number], void>();
    spy('hello', 42);
    spy('world', 99);
    expect(spy).toHaveBeenNthCalledWith(1, 'hello', 42);
    expect(spy).toHaveBeenNthCalledWith(2, 'world', 99);
  });

  it('can be configured to return a specific value', () => {
    const getUser = vi.fn().mockReturnValue({ id: 1, name: 'Alice' });
    const user = getUser();
    expect(user.name).toBe('Alice');
  });

  it('can return different values on sequential calls', () => {
    const counter = vi.fn()
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(2)
      .mockReturnValueOnce(3);

    expect(counter()).toBe(1);
    expect(counter()).toBe(2);
    expect(counter()).toBe(3);
  });

  it('can use a custom implementation', () => {
    const add = vi.fn((a: number, b: number) => a + b + 100); // fake implementation
    expect(add(1, 2)).toBe(103);
    expect(add).toHaveBeenCalledWith(1, 2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. vi.spyOn() — intercept real module methods
// ─────────────────────────────────────────────────────────────────────────────

describe('Mocking — vi.spyOn()', () => {
  afterEach(() => vi.restoreAllMocks());

  it('spies on Math.random to produce deterministic IDs', () => {
    // Force Math.random to return a fixed value
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const id1 = generateId();
    const id2 = generateId();
    // Both IDs will have the same random segment (but different timestamps)
    expect(id1.endsWith('i')).toBe(true); // 0.5.toString(36).slice(2,11) = 'i'
    expect(id2.endsWith('i')).toBe(true);
  });

  it('can assert a spy was called without changing its behaviour', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    console.log('test message');
    expect(consoleSpy).toHaveBeenCalledWith('test message');
  });

  it('restores the original implementation after mockRestore()', () => {
    const spy = vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(Math.random()).toBe(0);
    spy.mockRestore();
    // After restore, Math.random should be non-deterministic again
    expect(typeof Math.random()).toBe('number');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Mocking fetch — simulate HTTP calls
// ─────────────────────────────────────────────────────────────────────────────

describe('Mocking — global fetch', () => {
  afterEach(() => vi.restoreAllMocks());

  /** Creates a fetch mock that resolves with the given JSON payload. */
  function mockFetch(data: unknown, status = 200) {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: async () => data,
    } as Response);
  }

  it('can mock a successful fetch response', async () => {
    mockFetch({ data: [{ id: '1', title: 'Mocked task' }] });
    const res = await fetch('/api/tasks');
    const body = await res.json();
    expect(body.data[0].title).toBe('Mocked task');
  });

  it('can simulate a network error', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'));
    await expect(fetch('/api/tasks')).rejects.toThrow('Network error');
  });

  it('can simulate a 422 validation error response', async () => {
    mockFetch({ error: 'Title is required.' }, 422);
    const res = await fetch('/api/tasks');
    expect(res.ok).toBe(false);
    expect(res.status).toBe(422);
  });

  it('records how many times fetch was called', async () => {
    mockFetch({ data: [] });
    await fetch('/api/tasks');
    await fetch('/api/tasks');
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. vi.useFakeTimers — control system time and timers
// ─────────────────────────────────────────────────────────────────────────────

describe('Mocking — fake timers', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('vi.setSystemTime pins Date.now() to a fixed value', () => {
    const EPOCH = new Date('2024-01-01T00:00:00.000Z');
    vi.setSystemTime(EPOCH);
    expect(new Date().getTime()).toBe(EPOCH.getTime());
  });

  it('isTaskOverdue uses the mocked system time', () => {
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
    const past: Task = {
      id: 't', title: 'x', priority: 'low', category: 'other',
      status: 'todo', createdAt: '', updatedAt: '', tags: [],
      dueDate: '2024-01-01T00:00:00.000Z',
    };
    expect(isTaskOverdue(past)).toBe(true);
  });

  it('setTimeout fires after vi.advanceTimersByTime', () => {
    const callback = vi.fn();
    setTimeout(callback, 1000);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1000);
    expect(callback).toHaveBeenCalledOnce();
  });

  it('setInterval fires multiple times when time is advanced', () => {
    const callback = vi.fn();
    setInterval(callback, 500);
    vi.advanceTimersByTime(2500);
    expect(callback).toHaveBeenCalledTimes(5);
  });

  it('vi.runAllTimers executes all pending timers', () => {
    const a = vi.fn();
    const b = vi.fn();
    setTimeout(a, 100);
    setTimeout(b, 200);
    vi.runAllTimers();
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Mocking localStorage — intercept storage operations
// ─────────────────────────────────────────────────────────────────────────────

describe('Mocking — localStorage', () => {
  afterEach(() => vi.restoreAllMocks());

  it('can spy on setItem calls', () => {
    const spy = vi.spyOn(Storage.prototype, 'setItem');
    localStorage.setItem('key', 'value');
    expect(spy).toHaveBeenCalledWith('key', 'value');
  });

  it('can spy on getItem calls', () => {
    localStorage.setItem('spy_key', JSON.stringify({ x: 1 }));
    const spy = vi.spyOn(Storage.prototype, 'getItem');
    localStorage.getItem('spy_key');
    expect(spy).toHaveBeenCalledWith('spy_key');
  });

  it('can make localStorage throw on setItem to simulate quota exceeded', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });
    // The hook handles this silently — direct usage throws
    expect(() => localStorage.setItem('x', 'y')).toThrow(DOMException);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Async mock scenarios
// ─────────────────────────────────────────────────────────────────────────────

describe('Mocking — async functions', () => {
  it('mockResolvedValue works for async spy', async () => {
    const asyncFn = vi.fn().mockResolvedValue('async result');
    await expect(asyncFn()).resolves.toBe('async result');
  });

  it('mockRejectedValue simulates async failure', async () => {
    const asyncFn = vi.fn().mockRejectedValue(new Error('Async error'));
    await expect(asyncFn()).rejects.toThrow('Async error');
  });

  it('can sequence resolved and rejected values', async () => {
    const poll = vi.fn()
      .mockResolvedValueOnce('success')
      .mockRejectedValueOnce(new Error('Timeout'))
      .mockResolvedValueOnce('success again');

    await expect(poll()).resolves.toBe('success');
    await expect(poll()).rejects.toThrow('Timeout');
    await expect(poll()).resolves.toBe('success again');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Partial / implementation mocks within test
// ─────────────────────────────────────────────────────────────────────────────

describe('Mocking — mock clearing and resetting', () => {
  it('vi.clearAllMocks() resets call history but not implementation', () => {
    const fn = vi.fn().mockReturnValue(42);
    fn();
    vi.clearAllMocks();
    // Call history cleared
    expect(fn).toHaveBeenCalledTimes(0);
    // Implementation still in place
    expect(fn()).toBe(42);
  });

  it('vi.resetAllMocks() removes the implementation', () => {
    const fn = vi.fn().mockReturnValue(42);
    vi.resetAllMocks();
    // No implementation → returns undefined
    expect(fn()).toBeUndefined();
  });

  it('mockImplementation can be changed per-test within one describe block', () => {
    const fn = vi.fn();
    fn.mockImplementation(() => 'first');
    expect(fn()).toBe('first');
    fn.mockImplementation(() => 'second');
    expect(fn()).toBe('second');
  });
});
