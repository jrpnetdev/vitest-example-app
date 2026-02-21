import { Task } from '@/types';
import { getPriorityWeight } from './taskUtils';

/**
 * sorting.ts
 * ----------
 * Pure sort comparators and composed multi-sort utilities.
 * All functions are immutable — they never modify the input array.
 */

export type SortField = 'title' | 'priority' | 'createdAt' | 'dueDate' | 'status';
export type SortOrder = 'asc' | 'desc';

// ─── Individual Comparators ───────────────────────────────────────────────────

/** Alphabetical sort by title (case-insensitive). */
export function compareByTitle(a: Task, b: Task): number {
  return a.title.toLowerCase().localeCompare(b.title.toLowerCase());
}

/**
 * Priority sort — higher priority comes first (i.e. 'critical' before 'low').
 * Returns a negative number when `a` should appear before `b`.
 */
export function compareByPriority(a: Task, b: Task): number {
  return getPriorityWeight(b.priority) - getPriorityWeight(a.priority);
}

/** Creation-date sort — newer tasks first. */
export function compareByCreatedAt(a: Task, b: Task): number {
  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
}

/**
 * Due-date sort — tasks without a due date are pushed to the end.
 * Among tasks that have a due date, earlier deadlines come first.
 */
export function compareByDueDate(a: Task, b: Task): number {
  if (!a.dueDate && !b.dueDate) return 0;
  if (!a.dueDate) return 1;  // a has no due date → goes last
  if (!b.dueDate) return -1; // b has no due date → b goes last
  return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
}

// ─── Generic Sort ─────────────────────────────────────────────────────────────

const COMPARATORS: Record<SortField, (a: Task, b: Task) => number> = {
  title: compareByTitle,
  priority: compareByPriority,
  createdAt: compareByCreatedAt,
  dueDate: compareByDueDate,
  status: (a, b) => a.status.localeCompare(b.status),
};

/**
 * Returns a sorted copy of `tasks` according to the chosen field and order.
 * The input array is never mutated.
 *
 * @param tasks   The task array to sort.
 * @param field   The field to sort by.
 * @param order   "asc" for ascending, "desc" for descending.
 */
export function sortTasks(tasks: Task[], field: SortField, order: SortOrder): Task[] {
  const comparator = COMPARATORS[field];
  const sorted = [...tasks].sort(comparator);
  return order === 'desc' ? sorted.reverse() : sorted;
}

// ─── Multi-Sort ───────────────────────────────────────────────────────────────

export interface SortCriteria {
  field: SortField;
  order: SortOrder;
}

/**
 * Applies multiple sort criteria in sequence (secondary sort, tertiary, …).
 * The first criterion in the array has the highest precedence.
 *
 * @example
 * multiSort(tasks, [
 *   { field: 'priority', order: 'desc' },
 *   { field: 'dueDate',  order: 'asc'  },
 * ]);
 */
export function multiSort(tasks: Task[], criteria: SortCriteria[]): Task[] {
  return [...tasks].sort((a, b) => {
    for (const { field, order } of criteria) {
      const cmp = COMPARATORS[field](a, b);
      if (cmp !== 0) return order === 'asc' ? cmp : -cmp;
    }
    return 0;
  });
}
