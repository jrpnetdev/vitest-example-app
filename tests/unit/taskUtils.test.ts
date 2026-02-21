/**
 * tests/unit/taskUtils.test.ts
 * ----------------------------
 * Unit tests for lib/taskUtils.ts
 *
 * Testing approach:
 *   - Pure function testing: every function is deterministic and side-effect-free
 *     so each test is a simple input → output assertion.
 *   - Date mocking: vi.setSystemTime() freezes Date.now() so overdue calculations
 *     are reproducible regardless of when the suite runs.
 *   - Boundary / equivalence partitioning: tests cover the exact boundary
 *     values for priority weights and status transitions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  generateId,
  createTask,
  updateTask,
  duplicateTask,
  toggleTaskStatus,
  getPriorityWeight,
  comparePriorities,
  isTaskOverdue,
  getDaysUntilDue,
  filterTasksBySearch,
  groupTasksByCategory,
  groupTasksByStatus,
  calculateStats,
} from '@/lib/taskUtils';
import { Task } from '@/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

/** A minimal valid task used as a base for most tests. */
const BASE_TASK: Task = {
  id: 'task_test_001',
  title: 'Write documentation',
  description: 'Describe the testing strategy.',
  priority: 'medium',
  category: 'work',
  status: 'todo',
  dueDate: undefined,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tags: ['docs'],
};

// ── generateId ────────────────────────────────────────────────────────────────

describe('generateId', () => {
  it('returns a string prefixed with "task_"', () => {
    // IDs must be identifiable as task IDs at a glance.
    expect(generateId()).toMatch(/^task_/);
  });

  it('generates unique values on successive calls', () => {
    // Two rapid calls should never produce the same ID.
    const ids = new Set(Array.from({ length: 20 }, generateId));
    expect(ids.size).toBe(20);
  });

  it('contains only URL-safe characters', () => {
    // IDs may be used in URL paths, so no spaces or special chars.
    const id = generateId();
    expect(id).toMatch(/^[a-z0-9_]+$/);
  });
});

// ── createTask ────────────────────────────────────────────────────────────────

describe('createTask', () => {
  it('creates a task with the supplied title', () => {
    const task = createTask({ title: 'Buy milk' });
    expect(task.title).toBe('Buy milk');
  });

  it('trims whitespace from the title', () => {
    const task = createTask({ title: '  Buy milk  ' });
    expect(task.title).toBe('Buy milk');
  });

  it('defaults status to "todo"', () => {
    const task = createTask({ title: 'Any task' });
    expect(task.status).toBe('todo');
  });

  it('defaults priority to "medium"', () => {
    const task = createTask({ title: 'Any task' });
    expect(task.priority).toBe('medium');
  });

  it('defaults category to "other"', () => {
    const task = createTask({ title: 'Any task' });
    expect(task.category).toBe('other');
  });

  it('defaults tags to an empty array', () => {
    const task = createTask({ title: 'Any task' });
    expect(task.tags).toEqual([]);
  });

  it('assigns an auto-generated id', () => {
    const task = createTask({ title: 'Any task' });
    expect(task.id).toMatch(/^task_/);
  });

  it('sets createdAt and updatedAt to the same timestamp', () => {
    const task = createTask({ title: 'Any task' });
    expect(task.createdAt).toBe(task.updatedAt);
  });

  it('persists optional fields when provided', () => {
    const task = createTask({
      title: 'Specific task',
      description: 'Details here',
      priority: 'high',
      category: 'work',
      tags: ['urgent'],
      assignee: 'alice@example.com',
    });
    expect(task.description).toBe('Details here');
    expect(task.priority).toBe('high');
    expect(task.category).toBe('work');
    expect(task.tags).toEqual(['urgent']);
    expect(task.assignee).toBe('alice@example.com');
  });
});

// ── updateTask ────────────────────────────────────────────────────────────────

describe('updateTask', () => {
  it('merges partial updates into the task', () => {
    const updated = updateTask(BASE_TASK, { title: 'New title' });
    expect(updated.title).toBe('New title');
  });

  it('does not mutate the original task (immutability)', () => {
    updateTask(BASE_TASK, { title: 'New title' });
    expect(BASE_TASK.title).toBe('Write documentation');
  });

  it('preserves fields that are not in the update', () => {
    const updated = updateTask(BASE_TASK, { priority: 'high' });
    expect(updated.title).toBe(BASE_TASK.title);
    expect(updated.category).toBe(BASE_TASK.category);
  });

  it('prevents overwriting the id', () => {
    const updated = updateTask(BASE_TASK, { id: 'hacked_id' } as Partial<Task>);
    expect(updated.id).toBe(BASE_TASK.id);
  });

  it('prevents overwriting createdAt', () => {
    const updated = updateTask(BASE_TASK, { createdAt: '2099-01-01T00:00:00.000Z' });
    expect(updated.createdAt).toBe(BASE_TASK.createdAt);
  });

  it('bumps updatedAt to a value after createdAt', () => {
    const updated = updateTask(BASE_TASK, { title: 'Changed' });
    expect(new Date(updated.updatedAt).getTime()).toBeGreaterThanOrEqual(
      new Date(BASE_TASK.createdAt).getTime(),
    );
  });
});

// ── duplicateTask ─────────────────────────────────────────────────────────────

describe('duplicateTask', () => {
  it('prefixes the title with "Copy of"', () => {
    const copy = duplicateTask(BASE_TASK);
    expect(copy.title).toBe('Copy of Write documentation');
  });

  it('resets status to "todo"', () => {
    const doneTask: Task = { ...BASE_TASK, status: 'done' };
    const copy = duplicateTask(doneTask);
    expect(copy.status).toBe('todo');
  });

  it('generates a new unique id', () => {
    const copy = duplicateTask(BASE_TASK);
    expect(copy.id).not.toBe(BASE_TASK.id);
    expect(copy.id).toMatch(/^task_/);
  });

  it('copies all other fields from the original', () => {
    const copy = duplicateTask(BASE_TASK);
    expect(copy.priority).toBe(BASE_TASK.priority);
    expect(copy.category).toBe(BASE_TASK.category);
    expect(copy.tags).toEqual(BASE_TASK.tags);
  });
});

// ── toggleTaskStatus ──────────────────────────────────────────────────────────

describe('toggleTaskStatus', () => {
  it('advances "todo" → "in-progress"', () => {
    const result = toggleTaskStatus({ ...BASE_TASK, status: 'todo' });
    expect(result.status).toBe('in-progress');
  });

  it('advances "in-progress" → "done"', () => {
    const result = toggleTaskStatus({ ...BASE_TASK, status: 'in-progress' });
    expect(result.status).toBe('done');
  });

  it('cycles "done" back to "todo"', () => {
    const result = toggleTaskStatus({ ...BASE_TASK, status: 'done' });
    expect(result.status).toBe('todo');
  });

  it('does not mutate the original task', () => {
    const original = { ...BASE_TASK, status: 'todo' as const };
    toggleTaskStatus(original);
    expect(original.status).toBe('todo');
  });
});

// ── getPriorityWeight / comparePriorities ─────────────────────────────────────

describe('getPriorityWeight', () => {
  it('returns 1 for "low"',      () => expect(getPriorityWeight('low')).toBe(1));
  it('returns 2 for "medium"',   () => expect(getPriorityWeight('medium')).toBe(2));
  it('returns 3 for "high"',     () => expect(getPriorityWeight('high')).toBe(3));
  it('returns 4 for "critical"', () => expect(getPriorityWeight('critical')).toBe(4));
});

describe('comparePriorities', () => {
  it('returns a negative number when a > b (critical vs low)', () => {
    // Negative → critical should sort before low
    expect(comparePriorities('critical', 'low')).toBeLessThan(0);
  });

  it('returns a positive number when a < b (low vs critical)', () => {
    expect(comparePriorities('low', 'critical')).toBeGreaterThan(0);
  });

  it('returns 0 for equal priorities', () => {
    expect(comparePriorities('medium', 'medium')).toBe(0);
  });
});

// ── isTaskOverdue ─────────────────────────────────────────────────────────────

describe('isTaskOverdue', () => {
  const FIXED_NOW = new Date('2024-06-15T12:00:00.000Z');

  beforeEach(() => {
    // Freeze time so "now" is deterministic in every assertion.
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns true when the due date is in the past and status is not done', () => {
    const task: Task = { ...BASE_TASK, dueDate: '2024-06-01T00:00:00.000Z', status: 'todo' };
    expect(isTaskOverdue(task)).toBe(true);
  });

  it('returns false when the due date is in the future', () => {
    const task: Task = { ...BASE_TASK, dueDate: '2024-12-31T00:00:00.000Z', status: 'todo' };
    expect(isTaskOverdue(task)).toBe(false);
  });

  it('returns false when status is "done", even if due date is past', () => {
    const task: Task = { ...BASE_TASK, dueDate: '2024-01-01T00:00:00.000Z', status: 'done' };
    expect(isTaskOverdue(task)).toBe(false);
  });

  it('returns false when there is no due date', () => {
    expect(isTaskOverdue({ ...BASE_TASK, dueDate: undefined })).toBe(false);
  });
});

// ── getDaysUntilDue ───────────────────────────────────────────────────────────

describe('getDaysUntilDue', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T00:00:00.000Z'));
  });

  afterEach(() => { vi.useRealTimers(); });

  it('returns null when there is no due date', () => {
    expect(getDaysUntilDue({ ...BASE_TASK, dueDate: undefined })).toBeNull();
  });

  it('returns a positive number for future due dates', () => {
    const task = { ...BASE_TASK, dueDate: '2024-06-20T00:00:00.000Z' };
    expect(getDaysUntilDue(task)).toBeGreaterThan(0);
  });

  it('returns a negative number for past due dates', () => {
    const task = { ...BASE_TASK, dueDate: '2024-06-10T00:00:00.000Z' };
    expect(getDaysUntilDue(task)).toBeLessThan(0);
  });
});

// ── filterTasksBySearch ───────────────────────────────────────────────────────

describe('filterTasksBySearch', () => {
  const tasks: Task[] = [
    { ...BASE_TASK, id: '1', title: 'Buy groceries', tags: ['shopping'] },
    { ...BASE_TASK, id: '2', title: 'Write unit tests', description: 'Use Vitest', tags: [] },
    { ...BASE_TASK, id: '3', title: 'Call dentist', tags: ['health'] },
  ];

  it('returns all tasks when query is empty', () => {
    expect(filterTasksBySearch(tasks, '')).toHaveLength(3);
  });

  it('returns all tasks when query is only whitespace', () => {
    expect(filterTasksBySearch(tasks, '   ')).toHaveLength(3);
  });

  it('matches by title (case-insensitive)', () => {
    const result = filterTasksBySearch(tasks, 'GROCERIES');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Buy groceries');
  });

  it('matches by description', () => {
    const result = filterTasksBySearch(tasks, 'vitest');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('2');
  });

  it('matches by tag', () => {
    const result = filterTasksBySearch(tasks, 'health');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('3');
  });

  it('returns an empty array when no tasks match', () => {
    expect(filterTasksBySearch(tasks, 'xyz_no_match')).toHaveLength(0);
  });
});

// ── groupTasksByCategory ──────────────────────────────────────────────────────

describe('groupTasksByCategory', () => {
  const tasks: Task[] = [
    { ...BASE_TASK, id: '1', category: 'work' },
    { ...BASE_TASK, id: '2', category: 'work' },
    { ...BASE_TASK, id: '3', category: 'personal' },
  ];

  it('groups tasks by their category', () => {
    const groups = groupTasksByCategory(tasks);
    expect(groups.work).toHaveLength(2);
    expect(groups.personal).toHaveLength(1);
  });

  it('omits categories with no tasks', () => {
    const groups = groupTasksByCategory(tasks);
    expect(groups.shopping).toBeUndefined();
  });
});

// ── groupTasksByStatus ────────────────────────────────────────────────────────

describe('groupTasksByStatus', () => {
  const tasks: Task[] = [
    { ...BASE_TASK, id: '1', status: 'todo' },
    { ...BASE_TASK, id: '2', status: 'in-progress' },
    { ...BASE_TASK, id: '3', status: 'done' },
    { ...BASE_TASK, id: '4', status: 'done' },
  ];

  it('produces all three status keys', () => {
    const groups = groupTasksByStatus(tasks);
    expect(groups).toHaveProperty('todo');
    expect(groups).toHaveProperty('in-progress');
    expect(groups).toHaveProperty('done');
  });

  it('correctly counts tasks in each group', () => {
    const groups = groupTasksByStatus(tasks);
    expect(groups.todo).toHaveLength(1);
    expect(groups['in-progress']).toHaveLength(1);
    expect(groups.done).toHaveLength(2);
  });
});

// ── calculateStats ────────────────────────────────────────────────────────────

describe('calculateStats', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });
  afterEach(() => { vi.useRealTimers(); });

  const tasks: Task[] = [
    { ...BASE_TASK, id: '1', status: 'done',        priority: 'low',    category: 'work'     },
    { ...BASE_TASK, id: '2', status: 'in-progress', priority: 'high',   category: 'personal', dueDate: '2024-01-01T00:00:00.000Z' },
    { ...BASE_TASK, id: '3', status: 'todo',        priority: 'medium', category: 'work'     },
  ];

  it('counts total tasks correctly', () => {
    expect(calculateStats(tasks).total).toBe(3);
  });

  it('counts tasks by status', () => {
    const { byStatus } = calculateStats(tasks);
    expect(byStatus.done).toBe(1);
    expect(byStatus['in-progress']).toBe(1);
    expect(byStatus.todo).toBe(1);
  });

  it('counts tasks by priority', () => {
    const { byPriority } = calculateStats(tasks);
    expect(byPriority.low).toBe(1);
    expect(byPriority.high).toBe(1);
    expect(byPriority.medium).toBe(1);
    expect(byPriority.critical).toBe(0);
  });

  it('counts tasks by category', () => {
    const { byCategory } = calculateStats(tasks);
    expect(byCategory.work).toBe(2);
    expect(byCategory.personal).toBe(1);
  });

  it('identifies overdue tasks correctly', () => {
    // Task 2 has dueDate in the past and status !== done → overdue
    expect(calculateStats(tasks).overdue).toBe(1);
  });

  it('calculates completion rate as a rounded percentage', () => {
    // 1 done / 3 total = 33%
    expect(calculateStats(tasks).completionRate).toBe(33);
  });

  it('returns 0 completion rate for an empty task list', () => {
    expect(calculateStats([]).completionRate).toBe(0);
  });

  it('returns 100 completion rate when all tasks are done', () => {
    const allDone = tasks.map((t) => ({ ...t, status: 'done' as const }));
    expect(calculateStats(allDone).completionRate).toBe(100);
  });
});
