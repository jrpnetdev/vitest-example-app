/**
 * tests/advanced/edgeCases.test.ts
 * ----------------------------------
 * Edge case and boundary tests
 *
 * Testing approach:
 *   - These tests target conditions that are rare in normal usage but can
 *     cause crashes or silent data corruption if unhandled.
 *   - Categories:
 *       1. Empty / null / undefined inputs
 *       2. Extremely long strings
 *       3. Special characters and Unicode
 *       4. Boundary numeric values
 *       5. Date edge cases (epoch, year 9999, leap years)
 *       6. Array boundary conditions (0, 1, very large)
 *       7. Idempotency (applying the same operation twice)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createTask,
  updateTask,
  filterTasksBySearch,
  calculateStats,
  toggleTaskStatus,
  isTaskOverdue,
  getDaysUntilDue,
} from '@/lib/taskUtils';
import { sortTasks } from '@/lib/sorting';
import { applyFilters } from '@/lib/filtering';
import { validateTask, validateTitle, validateEmail } from '@/lib/validation';
import { formatDate, formatRelativeDate, getDaysBetween, addDays } from '@/lib/dateUtils';
import { Task, DEFAULT_FILTERS } from '@/types';

// ── Shared base task ──────────────────────────────────────────────────────────

const BASE: Task = {
  id: 'edge_001',
  title: 'Edge case task',
  priority: 'medium',
  category: 'work',
  status: 'todo',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tags: [],
};

// ── 1. Empty / null / undefined inputs ───────────────────────────────────────

describe('Edge cases — empty inputs', () => {
  it('filterTasksBySearch returns original array for empty string', () => {
    expect(filterTasksBySearch([BASE], '')).toHaveLength(1);
  });

  it('filterTasksBySearch returns original array for null-like whitespace', () => {
    expect(filterTasksBySearch([BASE], '   ')).toHaveLength(1);
  });

  it('calculateStats handles an empty task array without throwing', () => {
    expect(() => calculateStats([])).not.toThrow();
    expect(calculateStats([]).total).toBe(0);
    expect(calculateStats([]).completionRate).toBe(0);
  });

  it('sortTasks handles an empty array', () => {
    expect(sortTasks([], 'title', 'asc')).toEqual([]);
  });

  it('applyFilters returns empty array for empty input', () => {
    expect(applyFilters([], DEFAULT_FILTERS)).toHaveLength(0);
  });

  it('formatDate returns empty string for empty string input', () => {
    expect(formatDate('')).toBe('');
  });

  it('formatRelativeDate returns empty string for undefined', () => {
    expect(formatRelativeDate(undefined)).toBe('');
  });
});

// ── 2. Extremely long strings ─────────────────────────────────────────────────

describe('Edge cases — extremely long strings', () => {
  const VERY_LONG = 'A'.repeat(10_000);

  it('validateTitle fails gracefully for a 10,000-character title', () => {
    const result = validateTitle(VERY_LONG);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/not exceed/i);
  });

  it('filterTasksBySearch with a very long query returns no results without throwing', () => {
    expect(() => filterTasksBySearch([BASE], VERY_LONG)).not.toThrow();
    expect(filterTasksBySearch([BASE], VERY_LONG)).toHaveLength(0);
  });

  it('createTask trims a title that is long but within limits', () => {
    const longTitle = 'B'.repeat(120);
    const task = createTask({ title: longTitle });
    expect(task.title.length).toBe(120);
  });
});

// ── 3. Special characters and Unicode ────────────────────────────────────────

describe('Edge cases — special characters', () => {
  it('createTask preserves Unicode characters in title', () => {
    const task = createTask({ title: '购买杂货 🛒 αβγ' });
    expect(task.title).toBe('购买杂货 🛒 αβγ');
  });

  it('filterTasksBySearch matches Unicode query', () => {
    const unicodeTask: Task = { ...BASE, title: '购买杂货' };
    const result = filterTasksBySearch([unicodeTask], '购买');
    expect(result).toHaveLength(1);
  });

  it('createTask preserves SQL-injection-like strings (just stored as text)', () => {
    const injection = "'; DROP TABLE tasks; --";
    const task = createTask({ title: injection });
    expect(task.title).toBe(injection);
  });

  it('createTask preserves HTML-like strings (just stored as text)', () => {
    const xss = '<script>alert("xss")</script>';
    const task = createTask({ title: xss });
    expect(task.title).toBe(xss);
  });

  it('validateEmail rejects email with Unicode in domain', () => {
    // Simple regex validator — Unicode domains would typically need Punycode
    expect(validateEmail('user@例え.jp').valid).toBe(false);
  });
});

// ── 4. Date edge cases ────────────────────────────────────────────────────────

describe('Edge cases — dates', () => {
  it('formatDate handles the Unix epoch date', () => {
    const result = formatDate('1970-01-01T00:00:00.000Z');
    expect(result).toMatch(/1970/);
  });

  it('formatDate handles a far-future date (year 9999)', () => {
    const result = formatDate('9999-12-31T23:59:59.000Z');
    expect(result).toMatch(/9999/);
  });

  it('getDaysBetween handles leap year correctly (2024 is a leap year)', () => {
    const days = getDaysBetween('2024-02-28', '2024-03-01');
    expect(days).toBe(2); // Feb 28 → Feb 29 → Mar 1
  });

  it('addDays correctly crosses a month boundary', () => {
    const result = addDays('2024-01-30T00:00:00.000Z', 3);
    expect(result).toContain('2024-02-02');
  });

  it('isTaskOverdue handles a task with dueDate exactly at the current moment', () => {
    vi.useFakeTimers();
    const now = new Date('2024-06-15T12:00:00.000Z');
    vi.setSystemTime(now);

    // Due exactly at now — should NOT be overdue (not strictly before)
    const task: Task = { ...BASE, dueDate: now.toISOString(), status: 'todo' };
    // The comparison is `new Date() > new Date(dueDate)` — equal times are false
    expect(isTaskOverdue(task)).toBe(false);

    vi.useRealTimers();
  });

  it('getDaysUntilDue returns a negative integer for overdue tasks', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));

    const task: Task = { ...BASE, dueDate: '2024-06-10T00:00:00.000Z' };
    const days = getDaysUntilDue(task);
    expect(days).toBeLessThan(0);

    vi.useRealTimers();
  });
});

// ── 5. Single-element and boundary arrays ─────────────────────────────────────

describe('Edge cases — array boundaries', () => {
  it('sortTasks with a single task returns a one-element array', () => {
    expect(sortTasks([BASE], 'title', 'asc')).toHaveLength(1);
  });

  it('calculateStats with a single done task returns 100% completion rate', () => {
    const doneTask: Task = { ...BASE, status: 'done' };
    expect(calculateStats([doneTask]).completionRate).toBe(100);
  });

  it('calculateStats with a single todo task returns 0% completion rate', () => {
    expect(calculateStats([BASE]).completionRate).toBe(0);
  });
});

// ── 6. Idempotency ────────────────────────────────────────────────────────────

describe('Edge cases — idempotency', () => {
  it('applying applyFilters twice with the same filters gives the same result', () => {
    const tasks = [
      { ...BASE, id: '1', priority: 'low' as const },
      { ...BASE, id: '2', priority: 'high' as const },
    ];
    const filters = { ...DEFAULT_FILTERS, priority: 'high' as const };
    const first  = applyFilters(tasks, filters).map((t) => t.id);
    const second = applyFilters(tasks, filters).map((t) => t.id);
    expect(first).toEqual(second);
  });

  it('toggling status twice returns the task two steps ahead in the cycle', () => {
    // todo → in-progress → done
    const step1 = toggleTaskStatus(BASE);                   // in-progress
    const step2 = toggleTaskStatus(step1);                  // done
    expect(step2.status).toBe('done');
  });

  it('toggling status three times returns the task to its original status', () => {
    const step1 = toggleTaskStatus(BASE);
    const step2 = toggleTaskStatus(step1);
    const step3 = toggleTaskStatus(step2);
    expect(step3.status).toBe(BASE.status); // back to 'todo'
  });
});

// ── 7. updateTask protection ──────────────────────────────────────────────────

describe('Edge cases — updateTask immutability', () => {
  it('an empty update object returns a task equal to the original (except updatedAt)', () => {
    const updated = updateTask(BASE, {});
    expect(updated.title).toBe(BASE.title);
    expect(updated.priority).toBe(BASE.priority);
    expect(updated.id).toBe(BASE.id);
  });

  it('updating a task many times never mutates the original', () => {
    let current = BASE;
    for (let i = 0; i < 100; i++) {
      current = updateTask(current, { title: `Iteration ${i}` });
    }
    expect(BASE.title).toBe('Edge case task'); // original never changes
  });
});
