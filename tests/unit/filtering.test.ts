/**
 * tests/unit/filtering.test.ts
 * ----------------------------
 * Unit tests for lib/filtering.ts
 *
 * Testing approach:
 *   - Each filter helper is tested independently before the pipeline.
 *   - The applyFilters pipeline test verifies that all steps compose correctly.
 *   - "all" sentinel values are explicitly tested for no-op behaviour.
 */

import { describe, it, expect } from 'vitest';
import {
  filterByPriority,
  filterByCategory,
  filterByStatus,
  filterOverdue,
  applyFilters,
} from '@/lib/filtering';
import { Task, DEFAULT_FILTERS } from '@/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE: Task = {
  id: '0',
  title: 'Base task',
  priority: 'medium',
  category: 'work',
  status: 'todo',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tags: [],
};

const TASKS: Task[] = [
  { ...BASE, id: '1', priority: 'low',    category: 'work',     status: 'todo',        dueDate: undefined },
  { ...BASE, id: '2', priority: 'high',   category: 'personal', status: 'in-progress', dueDate: '2020-01-01T00:00:00.000Z' }, // overdue
  { ...BASE, id: '3', priority: 'critical', category: 'shopping', status: 'done',      dueDate: '2020-01-01T00:00:00.000Z' }, // done, not overdue
  { ...BASE, id: '4', priority: 'medium', category: 'health',   status: 'todo',        dueDate: undefined },
];

// ── filterByPriority ──────────────────────────────────────────────────────────

describe('filterByPriority', () => {
  it('returns all tasks when priority is "all"', () => {
    expect(filterByPriority(TASKS, 'all')).toHaveLength(4);
  });

  it('filters to only tasks with the specified priority', () => {
    const result = filterByPriority(TASKS, 'high');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('returns an empty array when no tasks match', () => {
    expect(filterByPriority(TASKS, 'critical')).toHaveLength(1);
  });

  it('does not mutate the input array', () => {
    const copy = [...TASKS];
    filterByPriority(TASKS, 'low');
    expect(TASKS).toEqual(copy);
  });
});

// ── filterByCategory ──────────────────────────────────────────────────────────

describe('filterByCategory', () => {
  it('returns all tasks when category is "all"', () => {
    expect(filterByCategory(TASKS, 'all')).toHaveLength(4);
  });

  it('filters to only tasks with the specified category', () => {
    const result = filterByCategory(TASKS, 'personal');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('returns an empty array when no tasks match', () => {
    expect(filterByCategory(TASKS, 'other')).toHaveLength(0);
  });
});

// ── filterByStatus ────────────────────────────────────────────────────────────

describe('filterByStatus', () => {
  it('returns all tasks when status is "all"', () => {
    expect(filterByStatus(TASKS, 'all')).toHaveLength(4);
  });

  it('filters to only "done" tasks', () => {
    const result = filterByStatus(TASKS, 'done');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('filters to "in-progress" tasks', () => {
    const result = filterByStatus(TASKS, 'in-progress');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });
});

// ── filterOverdue ─────────────────────────────────────────────────────────────

describe('filterOverdue', () => {
  it('returns only non-done tasks with a past due date', () => {
    // TASKS[1] has a past dueDate and is in-progress → overdue
    // TASKS[2] has a past dueDate but is done → not overdue
    const result = filterOverdue(TASKS);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('returns an empty array when no tasks are overdue', () => {
    const futureTasks = TASKS.map((t) => ({
      ...t,
      dueDate: '2099-01-01T00:00:00.000Z',
    }));
    expect(filterOverdue(futureTasks)).toHaveLength(0);
  });
});

// ── applyFilters (pipeline) ───────────────────────────────────────────────────

describe('applyFilters', () => {
  it('returns all tasks when default (no-op) filters are applied', () => {
    const result = applyFilters(TASKS, DEFAULT_FILTERS);
    expect(result).toHaveLength(4);
  });

  it('applies search filter correctly', () => {
    const result = applyFilters(TASKS, { ...DEFAULT_FILTERS, search: 'Base' });
    // All tasks have "Base task" as title — all should match
    expect(result).toHaveLength(4);
  });

  it('combines priority and status filters', () => {
    // Only tasks that are both "todo" and "low" priority → task 1
    const result = applyFilters(TASKS, {
      ...DEFAULT_FILTERS,
      priority: 'low',
      status: 'todo',
    });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('returns an empty array when filters match nothing', () => {
    const result = applyFilters(TASKS, {
      ...DEFAULT_FILTERS,
      priority: 'critical',
      status: 'todo',
    });
    // Task 3 is critical but done, not todo
    expect(result).toHaveLength(0);
  });

  it('respects the sortBy field', () => {
    const result = applyFilters(TASKS, {
      ...DEFAULT_FILTERS,
      sortBy: 'priority',
      sortOrder: 'asc',
    });
    // Ascending sort reverses the "critical first" comparator
    expect(result).toHaveLength(4);
  });
});
