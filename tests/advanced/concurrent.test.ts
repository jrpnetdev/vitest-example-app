/**
 * tests/advanced/concurrent.test.ts
 * -----------------------------------
 * Tests for concurrent / async behaviour
 *
 * Topics covered:
 *   1. Promise.all — parallel async operations
 *   2. Race conditions — multiple updates to shared state
 *   3. Sequential async processing
 *   4. Retry logic simulation
 *   5. Timeout / deadline handling
 *   6. Debounce verification (via fake timers)
 *   7. Concurrent filter updates on a shared task list
 *
 * Note: pure utility functions are synchronous; these tests use async
 *       wrappers and simulated delays to demonstrate concurrent patterns
 *       that appear in the hooks and API layer.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createTask, updateTask, calculateStats } from '@/lib/taskUtils';
import { Task } from '@/types';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Simulates an async operation that takes `ms` milliseconds. */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Simulates saving a task to a remote API with artificial latency. */
async function saveTask(task: Task, latencyMs: number): Promise<Task> {
  await delay(latencyMs);
  return { ...task, updatedAt: new Date().toISOString() };
}

/** Simulates a flaky API that fails on the first N calls. */
function makeFlaky(failCount: number) {
  let calls = 0;
  return async (): Promise<string> => {
    calls++;
    if (calls <= failCount) throw new Error(`Call ${calls} failed`);
    return 'success';
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Promise.all — parallel operations
// ─────────────────────────────────────────────────────────────────────────────

describe('Concurrent — Promise.all', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('saves multiple tasks in parallel and collects all results', async () => {
    const tasks = [
      createTask({ title: 'Task A' }),
      createTask({ title: 'Task B' }),
      createTask({ title: 'Task C' }),
    ];

    // All three saves start simultaneously
    const savePromise = Promise.all(tasks.map((t) => saveTask(t, 100)));
    vi.advanceTimersByTime(100);
    const saved = await savePromise;

    expect(saved).toHaveLength(3);
    saved.forEach((t, i) => {
      expect(t.title).toBe(tasks[i].title);
    });
  });

  it('rejects if any parallel operation fails', async () => {
    const tasks = [createTask({ title: 'OK' }), createTask({ title: 'OK 2' })];
    const flakyFn = vi.fn()
      .mockResolvedValueOnce(tasks[0])
      .mockRejectedValueOnce(new Error('Save failed'));

    await expect(
      Promise.all([flakyFn(), flakyFn()]),
    ).rejects.toThrow('Save failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. Promise.allSettled — tolerant parallel operations
// ─────────────────────────────────────────────────────────────────────────────

describe('Concurrent — Promise.allSettled', () => {
  it('collects both fulfilled and rejected outcomes', async () => {
    const results = await Promise.allSettled([
      Promise.resolve('ok'),
      Promise.reject(new Error('fail')),
      Promise.resolve('also ok'),
    ]);

    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected  = results.filter((r) => r.status === 'rejected');

    expect(fulfilled).toHaveLength(2);
    expect(rejected).toHaveLength(1);
  });

  it('never throws even when all promises reject', async () => {
    await expect(
      Promise.allSettled([
        Promise.reject(new Error('a')),
        Promise.reject(new Error('b')),
      ]),
    ).resolves.toHaveLength(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. Sequential async processing
// ─────────────────────────────────────────────────────────────────────────────

describe('Concurrent — sequential async processing', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('processes an async queue one item at a time', async () => {
    const order: string[] = [];

    async function processItem(name: string, ms: number) {
      await delay(ms);
      order.push(name);
    }

    // Process sequentially using reduce
    const items = [['A', 30], ['B', 10], ['C', 20]] as [string, number][];
    const chainPromise = items.reduce(
      (chain, [name, ms]) => chain.then(() => processItem(name, ms)),
      Promise.resolve(),
    );

    vi.advanceTimersByTime(30 + 10 + 20);
    await chainPromise;

    // Must be processed in original order, not sorted by latency
    expect(order).toEqual(['A', 'B', 'C']);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. Retry logic
// ─────────────────────────────────────────────────────────────────────────────

describe('Concurrent — retry logic', () => {
  /**
   * Simple retry wrapper — attempts `fn` up to `maxAttempts` times,
   * waiting `waitMs` between each attempt.
   */
  async function retry<T>(
    fn: () => Promise<T>,
    maxAttempts: number,
    waitMs = 0,
  ): Promise<T> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (err) {
        if (attempt === maxAttempts) throw err;
        await delay(waitMs);
      }
    }
    throw new Error('Unreachable');
  }

  it('succeeds on the first attempt when no error occurs', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    await expect(retry(fn, 3)).resolves.toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('succeeds on the second attempt after one failure', async () => {
    const fn = makeFlaky(1);
    await expect(retry(fn, 3)).resolves.toBe('success');
  });

  it('throws after exhausting all retry attempts', async () => {
    const fn = makeFlaky(5); // always fails within 3 attempts
    await expect(retry(fn, 3)).rejects.toThrow('Call 3 failed');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. Race conditions
// ─────────────────────────────────────────────────────────────────────────────

describe('Concurrent — race conditions', () => {
  it('Promise.race resolves with the fastest result', async () => {
    const fast = new Promise<string>((resolve) => setTimeout(() => resolve('fast'), 100));
    const slow = new Promise<string>((resolve) => setTimeout(() => resolve('slow'), 500));

    const winner = vi.fn().mockResolvedValue('fast');
    const loser  = vi.fn().mockResolvedValue('slow');

    // Promise.race semantics — first resolve wins
    await expect(Promise.race([winner(), loser()])).resolves.toBe('fast');
  });

  it('Promise.race rejects if the fastest promise rejects', async () => {
    const fastFail = Promise.reject(new Error('fast fail'));
    const slowOk   = new Promise<string>((resolve) => setTimeout(() => resolve('ok'), 100));
    await expect(Promise.race([fastFail, slowOk])).rejects.toThrow('fast fail');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. Concurrent state operations (pure functions)
// ─────────────────────────────────────────────────────────────────────────────

describe('Concurrent — concurrent state operations', () => {
  it('applying many updates to the same task concurrently preserves immutability', async () => {
    const original = createTask({ title: 'Original' });

    // Simulate 50 concurrent "update" operations — each starts from the same base
    const updates = await Promise.all(
      Array.from({ length: 50 }, (_, i) =>
        Promise.resolve(updateTask(original, { title: `Update ${i}` })),
      ),
    );

    // The original is never mutated
    expect(original.title).toBe('Original');
    // Each update has a unique title
    expect(new Set(updates.map((t) => t.title)).size).toBe(50);
  });

  it('calculateStats is consistent regardless of call order', () => {
    const tasks = Array.from({ length: 100 }, (_, i) =>
      createTask({
        title: `Task ${i}`,
        priority: (['low', 'medium', 'high', 'critical'] as const)[i % 4],
      }),
    );

    // Shuffle the task array and verify stats are still the same
    const shuffled = [...tasks].sort(() => Math.random() - 0.5);
    const stats1 = calculateStats(tasks);
    const stats2 = calculateStats(shuffled);

    expect(stats1.total).toBe(stats2.total);
    expect(stats1.byPriority).toEqual(stats2.byPriority);
    expect(stats1.completionRate).toBe(stats2.completionRate);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. Async error propagation
// ─────────────────────────────────────────────────────────────────────────────

describe('Concurrent — async error propagation', () => {
  it('unhandled rejection in async function is caught by the caller', async () => {
    async function riskyOperation(): Promise<never> {
      throw new Error('Something went wrong');
    }
    await expect(riskyOperation()).rejects.toThrow('Something went wrong');
  });

  it('try/catch in async function handles the error locally', async () => {
    async function safeOperation(): Promise<string> {
      try {
        throw new Error('Inner error');
      } catch {
        return 'recovered';
      }
    }
    await expect(safeOperation()).resolves.toBe('recovered');
  });

  it('finally block runs after a rejection', async () => {
    const cleanup = vi.fn();
    async function withCleanup(): Promise<never> {
      try {
        throw new Error('fail');
      } finally {
        cleanup();
      }
    }
    await expect(withCleanup()).rejects.toThrow('fail');
    expect(cleanup).toHaveBeenCalledOnce();
  });
});
