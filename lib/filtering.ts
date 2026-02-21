import { Task, TaskFilters, Priority, Category, Status } from '@/types';
import { filterTasksBySearch } from './taskUtils';
import { sortTasks, SortField, SortOrder } from './sorting';

/**
 * filtering.ts
 * ------------
 * Composes the individual search, filter, and sort steps into a single
 * pipeline that powers the main task list view.
 */

// ─── Individual Filters ───────────────────────────────────────────────────────

/**
 * Keeps only tasks whose priority matches the given value.
 * Pass "all" to disable priority filtering.
 */
export function filterByPriority(tasks: Task[], priority: Priority | 'all'): Task[] {
  if (priority === 'all') return tasks;
  return tasks.filter((t) => t.priority === priority);
}

/**
 * Keeps only tasks whose category matches the given value.
 * Pass "all" to disable category filtering.
 */
export function filterByCategory(tasks: Task[], category: Category | 'all'): Task[] {
  if (category === 'all') return tasks;
  return tasks.filter((t) => t.category === category);
}

/**
 * Keeps only tasks whose status matches the given value.
 * Pass "all" to disable status filtering.
 */
export function filterByStatus(tasks: Task[], status: Status | 'all'): Task[] {
  if (status === 'all') return tasks;
  return tasks.filter((t) => t.status === status);
}

/**
 * Keeps only tasks that are overdue (past due date and not "done").
 * This filter is not part of TaskFilters but is useful for dashboards.
 */
export function filterOverdue(tasks: Task[]): Task[] {
  const now = new Date();
  return tasks.filter(
    (t) => t.dueDate && t.status !== 'done' && new Date(t.dueDate) < now,
  );
}

// ─── Composed Pipeline ────────────────────────────────────────────────────────

/**
 * Applies the full filter, search, and sort pipeline described by `filters`
 * to the supplied task array.
 *
 * Steps executed in order:
 *   1. Free-text search (title, description, tags)
 *   2. Priority filter
 *   3. Category filter
 *   4. Status filter
 *   5. Sort
 *
 * The input array is never mutated.
 */
export function applyFilters(tasks: Task[], filters: TaskFilters): Task[] {
  let result = filterTasksBySearch(tasks, filters.search);
  result = filterByPriority(result, filters.priority);
  result = filterByCategory(result, filters.category);
  result = filterByStatus(result, filters.status);
  result = sortTasks(result, filters.sortBy as SortField, filters.sortOrder as SortOrder);
  return result;
}
