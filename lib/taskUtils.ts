import { Task, Priority, Status, Category, TaskStats, CreateTaskPayload } from '@/types';

// ─── ID Generation ────────────────────────────────────────────────────────────

/**
 * Generates a probabilistically-unique task identifier.
 * Format: "task_<timestamp>_<random>" — human-readable and sortable by creation time.
 */
export function generateId(): string {
  return `task_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
}

// ─── CRUD Helpers ─────────────────────────────────────────────────────────────

/**
 * Builds a complete Task object from a partial creation payload,
 * filling in sensible defaults for every optional field.
 */
export function createTask(data: CreateTaskPayload): Task {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    title: data.title.trim(),
    description: data.description?.trim(),
    priority: data.priority ?? 'medium',
    category: data.category ?? 'other',
    status: 'todo',
    dueDate: data.dueDate,
    createdAt: now,
    updatedAt: now,
    tags: data.tags ?? [],
    assignee: data.assignee,
  };
}

/**
 * Returns a new Task object with the supplied fields merged in.
 * Immutable — the original task is never modified.
 * `id` and `createdAt` are protected and cannot be overwritten.
 */
export function updateTask(task: Task, updates: Partial<Task>): Task {
  return {
    ...task,
    ...updates,
    id: task.id,           // immutable
    createdAt: task.createdAt, // immutable
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Creates a shallow clone of a task with a fresh id and reset status.
 * Useful for "duplicate task" UI actions.
 */
export function duplicateTask(task: Task): Task {
  const now = new Date().toISOString();
  return {
    ...task,
    id: generateId(),
    title: `Copy of ${task.title}`,
    status: 'todo',
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Status Transitions ───────────────────────────────────────────────────────

/** Cyclic status transitions: todo → in-progress → done → todo. */
const NEXT_STATUS: Record<Status, Status> = {
  todo: 'in-progress',
  'in-progress': 'done',
  done: 'todo',
};

/**
 * Advances a task to the next status in the cycle.
 * Returns a new Task — does not mutate the input.
 */
export function toggleTaskStatus(task: Task): Task {
  return updateTask(task, { status: NEXT_STATUS[task.status] });
}

// ─── Priority Utilities ───────────────────────────────────────────────────────

/** Numeric weight for each priority level — used for comparison and sorting. */
const PRIORITY_WEIGHTS: Record<Priority, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

/** Returns the integer weight for a given priority label. */
export function getPriorityWeight(priority: Priority): number {
  return PRIORITY_WEIGHTS[priority];
}

/**
 * Compares two priority values.
 * Returns positive if `a` has higher priority, negative if lower, 0 if equal.
 */
export function comparePriorities(a: Priority, b: Priority): number {
  return getPriorityWeight(b) - getPriorityWeight(a);
}

// ─── Overdue Detection ────────────────────────────────────────────────────────

/**
 * Returns true when a task has a due date in the past and is not yet done.
 * Uses the current wall-clock time so tests can spy on / mock Date.
 */
export function isTaskOverdue(task: Task): boolean {
  if (!task.dueDate || task.status === 'done') return false;
  return new Date() > new Date(task.dueDate);
}

/**
 * Returns the number of days until a task is due (negative = already past).
 * Returns null when the task has no due date.
 */
export function getDaysUntilDue(task: Task): number | null {
  if (!task.dueDate) return null;
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.ceil((new Date(task.dueDate).getTime() - Date.now()) / msPerDay);
}

// ─── Search & Grouping ────────────────────────────────────────────────────────

/**
 * Filters tasks by a free-text query across title, description, and tags.
 * Case-insensitive; returns all tasks when the query is blank.
 */
export function filterTasksBySearch(tasks: Task[], query: string): Task[] {
  const q = query.trim().toLowerCase();
  if (!q) return tasks;
  return tasks.filter(
    (task) =>
      task.title.toLowerCase().includes(q) ||
      task.description?.toLowerCase().includes(q) ||
      task.tags.some((tag) => tag.toLowerCase().includes(q)),
  );
}

/**
 * Groups an array of tasks into a map keyed by category.
 * Categories with no tasks are omitted from the result.
 */
export function groupTasksByCategory(tasks: Task[]): Partial<Record<Category, Task[]>> {
  return tasks.reduce<Partial<Record<Category, Task[]>>>((acc, task) => {
    (acc[task.category] ??= []).push(task);
    return acc;
  }, {});
}

/**
 * Groups tasks by their current status.
 * All three status keys are always present in the result (possibly empty arrays).
 */
export function groupTasksByStatus(tasks: Task[]): Record<Status, Task[]> {
  const groups: Record<Status, Task[]> = { todo: [], 'in-progress': [], done: [] };
  tasks.forEach((task) => groups[task.status].push(task));
  return groups;
}

// ─── Statistics ───────────────────────────────────────────────────────────────

/**
 * Derives aggregate statistics from a task array.
 * All counts start at zero so callers always receive a fully-typed object.
 */
export function calculateStats(tasks: Task[]): TaskStats {
  const stats: TaskStats = {
    total: tasks.length,
    byStatus: { todo: 0, 'in-progress': 0, done: 0 },
    byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
    byCategory: { work: 0, personal: 0, shopping: 0, health: 0, other: 0 },
    overdue: 0,
    completionRate: 0,
  };

  tasks.forEach((task) => {
    stats.byStatus[task.status]++;
    stats.byPriority[task.priority]++;
    stats.byCategory[task.category]++;
    if (isTaskOverdue(task)) stats.overdue++;
  });

  stats.completionRate =
    tasks.length > 0 ? Math.round((stats.byStatus.done / tasks.length) * 100) : 0;

  return stats;
}
