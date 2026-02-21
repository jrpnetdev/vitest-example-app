'use client';

import { useCallback, useMemo, useState } from 'react';
import { Task, TaskFilters, CreateTaskPayload } from '@/types';
import { createTask, updateTask, calculateStats, duplicateTask, toggleTaskStatus } from '@/lib/taskUtils';
import { applyFilters } from '@/lib/filtering';
import { useLocalStorage } from './useLocalStorage';

/** Seed data so the app is non-empty on first launch. */
const INITIAL_TASKS: Task[] = [
  {
    id: 'task_seed_1',
    title: 'Set up project repository',
    description: 'Initialise Git, add .gitignore, push to remote.',
    priority: 'high',
    category: 'work',
    status: 'done',
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    tags: ['git', 'devops'],
  },
  {
    id: 'task_seed_2',
    title: 'Write unit tests for task utilities',
    description: 'Cover createTask, updateTask, calculateStats, etc.',
    priority: 'medium',
    category: 'work',
    status: 'in-progress',
    dueDate: new Date(Date.now() + 172800000).toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date(Date.now() - 3600000).toISOString(),
    tags: ['testing', 'vitest'],
  },
  {
    id: 'task_seed_3',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread, coffee.',
    priority: 'low',
    category: 'shopping',
    status: 'todo',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
  },
];

/**
 * useTasks
 * --------
 * Central state hook for the task list.
 *
 * Responsibilities:
 *   - Persists tasks to localStorage via useLocalStorage.
 *   - Provides CRUD operations (add, update, remove, duplicate, toggle).
 *   - Derives filtered/sorted view via applyFilters.
 *   - Computes aggregated statistics via calculateStats.
 */
export function useTasks(filters: TaskFilters) {
  const [tasks, setTasks] = useLocalStorage<Task[]>('taskflow_tasks', INITIAL_TASKS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Derived values ──────────────────────────────────────────────────────────

  /** Tasks after applying all active filters — memoised for render efficiency. */
  const filteredTasks = useMemo(() => applyFilters(tasks, filters), [tasks, filters]);

  /** Aggregate statistics across the full (unfiltered) task list. */
  const stats = useMemo(() => calculateStats(tasks), [tasks]);

  // ── Mutations ───────────────────────────────────────────────────────────────

  const addTask = useCallback(
    (payload: CreateTaskPayload) => {
      const newTask = createTask(payload);
      setTasks((prev) => [newTask, ...prev]);
      return newTask;
    },
    [setTasks],
  );

  const editTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? updateTask(t, updates) : t)),
      );
    },
    [setTasks],
  );

  const removeTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
    },
    [setTasks],
  );

  const duplicateTaskById = useCallback(
    (id: string) => {
      const original = tasks.find((t) => t.id === id);
      if (!original) return null;
      const copy = duplicateTask(original);
      setTasks((prev) => {
        const index = prev.findIndex((t) => t.id === id);
        const next = [...prev];
        next.splice(index + 1, 0, copy);
        return next;
      });
      return copy;
    },
    [tasks, setTasks],
  );

  const toggleStatus = useCallback(
    (id: string) => {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? toggleTaskStatus(t) : t)),
      );
    },
    [setTasks],
  );

  const clearAllTasks = useCallback(() => {
    setTasks([]);
  }, [setTasks]);

  return {
    // State
    tasks,
    filteredTasks,
    stats,
    isLoading,
    error,
    // Mutations
    addTask,
    editTask,
    removeTask,
    duplicateTaskById,
    toggleStatus,
    clearAllTasks,
  };
}
