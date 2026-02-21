/**
 * tests/hooks/useTasks.test.ts
 * -----------------------------
 * Tests for hooks/useTasks.ts
 *
 * Testing approach:
 *   - renderHook provides access to the hook's return values after each act().
 *   - Seed data is cleared from localStorage before each test so tests are
 *     independent.
 *   - CRUD operations (add, edit, remove, duplicate, toggle) are each verified
 *     to update state correctly without mutating prior entries.
 *   - The filteredTasks derived value is verified to react to filter changes.
 *   - calculateStats is indirectly tested through the stats return value.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTasks } from '@/hooks/useTasks';
import { DEFAULT_FILTERS } from '@/types';

// Clear persisted tasks before each test so seed data doesn't interfere.
beforeEach(() => {
  localStorage.clear();
});

describe('useTasks — initial state', () => {
  it('starts with seed tasks when localStorage is empty', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    // The hook loads seed data on first render
    expect(result.current.tasks.length).toBeGreaterThan(0);
  });

  it('exposes filteredTasks and stats from the start', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    expect(result.current.filteredTasks).toBeDefined();
    expect(result.current.stats).toBeDefined();
  });
});

describe('useTasks — addTask', () => {
  it('adds a task to the beginning of the list', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    const initialCount = result.current.tasks.length;

    act(() => {
      result.current.addTask({ title: 'Brand new task' });
    });

    expect(result.current.tasks).toHaveLength(initialCount + 1);
    // New task should be at index 0 (prepended)
    expect(result.current.tasks[0].title).toBe('Brand new task');
  });

  it('returns the newly created task object', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    let newTask: ReturnType<typeof result.current.addTask>;

    act(() => {
      newTask = result.current.addTask({ title: 'Return me', priority: 'high' });
    });

    expect(newTask!.id).toMatch(/^task_/);
    expect(newTask!.title).toBe('Return me');
  });

  it('increments the stats total', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    const initialTotal = result.current.stats.total;

    act(() => { result.current.addTask({ title: 'Count me' }); });

    expect(result.current.stats.total).toBe(initialTotal + 1);
  });
});

describe('useTasks — editTask', () => {
  it('updates only the targeted task', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    let addedId: string;

    act(() => {
      const t = result.current.addTask({ title: 'Original title' });
      addedId = t.id;
    });

    act(() => {
      result.current.editTask(addedId!, { title: 'Updated title' });
    });

    const found = result.current.tasks.find((t) => t.id === addedId!);
    expect(found?.title).toBe('Updated title');
  });

  it('does not affect other tasks in the list', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    let id1: string;
    let id2: string;

    act(() => {
      id1 = result.current.addTask({ title: 'Task A' }).id;
      id2 = result.current.addTask({ title: 'Task B' }).id;
    });

    act(() => {
      result.current.editTask(id1!, { title: 'Task A — Edited' });
    });

    const taskB = result.current.tasks.find((t) => t.id === id2!);
    expect(taskB?.title).toBe('Task B');
  });
});

describe('useTasks — removeTask', () => {
  it('removes the task with the given id', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    let id: string;

    act(() => { id = result.current.addTask({ title: 'Delete me' }).id; });
    act(() => { result.current.removeTask(id!); });

    expect(result.current.tasks.find((t) => t.id === id!)).toBeUndefined();
  });

  it('decrements the total task count by one', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    let id: string;

    act(() => { id = result.current.addTask({ title: 'Remove' }).id; });
    const countBefore = result.current.tasks.length;
    act(() => { result.current.removeTask(id!); });

    expect(result.current.tasks).toHaveLength(countBefore - 1);
  });

  it('does not remove unrelated tasks', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    let idA: string;
    let idB: string;

    act(() => {
      idA = result.current.addTask({ title: 'Keep me' }).id;
      idB = result.current.addTask({ title: 'Delete me' }).id;
    });
    act(() => { result.current.removeTask(idB!); });

    expect(result.current.tasks.find((t) => t.id === idA!)).toBeDefined();
  });
});

describe('useTasks — duplicateTaskById', () => {
  it('inserts a copy of the task immediately after the original', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    // Start fresh — clear seed data by adding our own task on top
    let id: string;

    act(() => { id = result.current.addTask({ title: 'Original' }).id; });
    act(() => { result.current.duplicateTaskById(id!); });

    const tasks = result.current.tasks;
    const originalIndex = tasks.findIndex((t) => t.id === id!);
    expect(tasks[originalIndex + 1]?.title).toBe('Copy of Original');
  });

  it('returns null when the task id does not exist', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    let returned: ReturnType<typeof result.current.duplicateTaskById>;

    act(() => { returned = result.current.duplicateTaskById('nonexistent_id'); });

    expect(returned!).toBeNull();
  });

  it('the duplicate has a different id from the original', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    let original: { id: string };
    let copy: ReturnType<typeof result.current.duplicateTaskById>;

    act(() => { original = result.current.addTask({ title: 'Orig' }); });
    act(() => { copy = result.current.duplicateTaskById(original.id); });

    expect(copy!.id).not.toBe(original.id);
  });
});

describe('useTasks — toggleStatus', () => {
  it('cycles task status from todo → in-progress', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    let id: string;

    act(() => { id = result.current.addTask({ title: 'Cycle me' }).id; });
    // New tasks start as 'todo'
    act(() => { result.current.toggleStatus(id!); });

    const updated = result.current.tasks.find((t) => t.id === id!);
    expect(updated?.status).toBe('in-progress');
  });

  it('cycles task status from in-progress → done', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));
    let id: string;

    act(() => { id = result.current.addTask({ title: 'Cycle twice' }).id; });
    act(() => { result.current.toggleStatus(id!); }); // todo → in-progress
    act(() => { result.current.toggleStatus(id!); }); // in-progress → done

    const updated = result.current.tasks.find((t) => t.id === id!);
    expect(updated?.status).toBe('done');
  });
});

describe('useTasks — filteredTasks', () => {
  it('returns only tasks matching the active filters', () => {
    // Render with a filter that restricts to 'critical' priority
    const { result } = renderHook(() =>
      useTasks({ ...DEFAULT_FILTERS, priority: 'critical' }),
    );

    act(() => {
      result.current.addTask({ title: 'Normal',   priority: 'low' });
      result.current.addTask({ title: 'Urgent',   priority: 'critical' });
    });

    const filtered = result.current.filteredTasks;
    expect(filtered.every((t) => t.priority === 'critical')).toBe(true);
  });
});

describe('useTasks — clearAllTasks', () => {
  it('removes all tasks from the list', () => {
    const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));

    act(() => {
      result.current.addTask({ title: 'Task 1' });
      result.current.addTask({ title: 'Task 2' });
    });

    act(() => { result.current.clearAllTasks(); });

    expect(result.current.tasks).toHaveLength(0);
    expect(result.current.stats.total).toBe(0);
  });
});
