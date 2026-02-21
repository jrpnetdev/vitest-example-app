// ─── Domain Types ────────────────────────────────────────────────────────────

/** Task urgency level — used for sorting and visual prioritisation. */
export type Priority = 'low' | 'medium' | 'high' | 'critical';

/** Broad grouping of a task's subject area. */
export type Category = 'work' | 'personal' | 'shopping' | 'health' | 'other';

/** Lifecycle state of a single task. */
export type Status = 'todo' | 'in-progress' | 'done';

/** The canonical shape of a task entity throughout the application. */
export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: Priority;
  category: Category;
  status: Status;
  /** ISO 8601 date string, e.g. "2024-06-30T00:00:00.000Z" */
  dueDate?: string;
  /** ISO 8601 timestamp set on creation — never mutated afterwards. */
  createdAt: string;
  /** ISO 8601 timestamp updated whenever the task is modified. */
  updatedAt: string;
  tags: string[];
  assignee?: string;
}

// ─── Filter / Sort Types ─────────────────────────────────────────────────────

/** All controllable filter and sort parameters for the task list view. */
export interface TaskFilters {
  search: string;
  priority: Priority | 'all';
  category: Category | 'all';
  status: Status | 'all';
  sortBy: 'createdAt' | 'dueDate' | 'priority' | 'title';
  sortOrder: 'asc' | 'desc';
}

/** Default filter values used when the app first loads. */
export const DEFAULT_FILTERS: TaskFilters = {
  search: '',
  priority: 'all',
  category: 'all',
  status: 'all',
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

// ─── Statistics Types ─────────────────────────────────────────────────────────

/** Aggregated statistics derived from the current task list. */
export interface TaskStats {
  total: number;
  byStatus: Record<Status, number>;
  byPriority: Record<Priority, number>;
  byCategory: Record<Category, number>;
  overdue: number;
  /** 0–100 percentage of tasks in the "done" state. */
  completionRate: number;
}

// ─── API Types ────────────────────────────────────────────────────────────────

/** Payload accepted by POST /api/tasks. */
export interface CreateTaskPayload {
  title: string;
  description?: string;
  priority?: Priority;
  category?: Category;
  dueDate?: string;
  tags?: string[];
  assignee?: string;
}

/** Payload accepted by PATCH /api/tasks/:id. */
export type UpdateTaskPayload = Partial<Omit<Task, 'id' | 'createdAt'>>;

/** Standard envelope returned by every API endpoint. */
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}
