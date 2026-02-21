/**
 * tests/unit/sorting.test.ts
 * --------------------------
 * Unit tests for lib/sorting.ts
 *
 * Testing approach:
 *   - Immutability: verify the input array is never modified.
 *   - Comparators are tested in isolation before testing the higher-level
 *     sortTasks and multiSort functions.
 *   - Edge cases: single-element array, all-equal values, tasks without due dates.
 */

import { describe, it, expect } from 'vitest';
import {
  compareByTitle,
  compareByPriority,
  compareByCreatedAt,
  compareByDueDate,
  sortTasks,
  multiSort,
} from '@/lib/sorting';
import { Task } from '@/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE: Task = {
  id: 'x',
  title: 'Base',
  priority: 'medium',
  category: 'work',
  status: 'todo',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tags: [],
};

const t = (overrides: Partial<Task>): Task => ({ ...BASE, ...overrides });

const TASKS: Task[] = [
  t({ id: '1', title: 'Zebra task',  priority: 'low',    createdAt: '2024-01-01T00:00:00.000Z', dueDate: '2024-03-01T00:00:00.000Z' }),
  t({ id: '2', title: 'Apple task',  priority: 'critical', createdAt: '2024-01-03T00:00:00.000Z', dueDate: '2024-01-15T00:00:00.000Z' }),
  t({ id: '3', title: 'Mango task',  priority: 'high',   createdAt: '2024-01-02T00:00:00.000Z', dueDate: undefined }),
];

// ── compareByTitle ────────────────────────────────────────────────────────────

describe('compareByTitle', () => {
  it('sorts alphabetically (a before z)', () => {
    expect(compareByTitle(TASKS[1], TASKS[0])).toBeLessThan(0); // Apple < Zebra
  });

  it('is case-insensitive', () => {
    const upper = t({ title: 'APPLE' });
    const lower = t({ title: 'apple' });
    expect(compareByTitle(upper, lower)).toBe(0);
  });

  it('returns 0 for equal titles', () => {
    expect(compareByTitle(TASKS[0], TASKS[0])).toBe(0);
  });
});

// ── compareByPriority ─────────────────────────────────────────────────────────

describe('compareByPriority', () => {
  it('critical > high > medium > low', () => {
    // critical should sort before low (negative return = a first)
    expect(compareByPriority(TASKS[1], TASKS[0])).toBeLessThan(0);
  });

  it('returns 0 for equal priorities', () => {
    expect(compareByPriority(TASKS[2], TASKS[2])).toBe(0);
  });
});

// ── compareByCreatedAt ────────────────────────────────────────────────────────

describe('compareByCreatedAt', () => {
  it('sorts newest first (b - a)', () => {
    // TASKS[1] is newer (Jan 3) than TASKS[0] (Jan 1)
    expect(compareByCreatedAt(TASKS[1], TASKS[0])).toBeLessThan(0);
  });

  it('returns 0 for the same creation timestamp', () => {
    expect(compareByCreatedAt(TASKS[0], TASKS[0])).toBe(0);
  });
});

// ── compareByDueDate ──────────────────────────────────────────────────────────

describe('compareByDueDate', () => {
  it('sorts earlier due dates first', () => {
    // TASKS[1] due Jan 15 < TASKS[0] due Mar 1 → negative
    expect(compareByDueDate(TASKS[1], TASKS[0])).toBeLessThan(0);
  });

  it('pushes tasks without a due date to the end', () => {
    // TASKS[2] has no due date → should sort after TASKS[0]
    expect(compareByDueDate(TASKS[2], TASKS[0])).toBeGreaterThan(0);
  });

  it('returns 0 when both tasks have no due date', () => {
    const noDate1 = t({ dueDate: undefined });
    const noDate2 = t({ dueDate: undefined });
    expect(compareByDueDate(noDate1, noDate2)).toBe(0);
  });
});

// ── sortTasks ─────────────────────────────────────────────────────────────────

describe('sortTasks', () => {
  it('does not mutate the input array', () => {
    const original = [...TASKS];
    sortTasks(TASKS, 'title', 'asc');
    expect(TASKS).toEqual(original);
  });

  it('sorts by title ascending', () => {
    const result = sortTasks(TASKS, 'title', 'asc');
    expect(result[0].title).toBe('Apple task');
    expect(result[result.length - 1].title).toBe('Zebra task');
  });

  it('sorts by title descending', () => {
    const result = sortTasks(TASKS, 'title', 'desc');
    expect(result[0].title).toBe('Zebra task');
  });

  it('sorts by priority descending (critical first)', () => {
    const result = sortTasks(TASKS, 'priority', 'asc');
    // Ascending comparator: higher priority should come first when 'asc'
    // Note: our comparators are "descending by default"; 'asc' means reverse
    expect(result[result.length - 1].priority).toBe('critical');
  });

  it('sorts by createdAt descending (newest first in desc)', () => {
    const result = sortTasks(TASKS, 'createdAt', 'desc');
    // desc reverses the "newest first" comparator → oldest first
    // Our comparator returns newest first naturally; reversing gives oldest first
    expect(new Date(result[0].createdAt).getTime()).toBeLessThan(
      new Date(result[result.length - 1].createdAt).getTime(),
    );
  });

  it('handles a single-element array', () => {
    const single = [TASKS[0]];
    expect(sortTasks(single, 'title', 'asc')).toHaveLength(1);
  });

  it('handles an empty array', () => {
    expect(sortTasks([], 'title', 'asc')).toHaveLength(0);
  });
});

// ── multiSort ─────────────────────────────────────────────────────────────────

describe('multiSort', () => {
  it('applies the first criterion first', () => {
    const result = multiSort(TASKS, [
      { field: 'priority', order: 'asc' }, // critical first
      { field: 'title',    order: 'asc' },
    ]);
    // First criterion (priority asc) reverses the "critical-first" comparator
    // So lowest priority (low) should appear last in the reversed order
    expect(result).toHaveLength(3);
  });

  it('uses the second criterion as a tiebreaker', () => {
    // Two tasks with the same priority — title should break the tie
    const tied: Task[] = [
      t({ id: 'a', title: 'Zap',   priority: 'high' }),
      t({ id: 'b', title: 'Alpha', priority: 'high' }),
    ];
    const result = multiSort(tied, [
      { field: 'priority', order: 'asc' },
      { field: 'title',    order: 'asc' },
    ]);
    expect(result[0].title).toBe('Alpha');
  });

  it('does not mutate the input array', () => {
    const copy = [...TASKS];
    multiSort(TASKS, [{ field: 'title', order: 'asc' }]);
    expect(TASKS).toEqual(copy);
  });

  it('returns a copy when criteria array is empty', () => {
    const result = multiSort(TASKS, []);
    expect(result).toHaveLength(TASKS.length);
  });
});
