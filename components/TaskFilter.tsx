import { TaskFilters, Priority, Category, Status } from '@/types';

interface TaskFilterProps {
  filters: TaskFilters;
  onPriorityChange: (p: Priority | 'all') => void;
  onCategoryChange: (c: Category | 'all') => void;
  onStatusChange: (s: Status | 'all') => void;
  onSortByChange: (field: TaskFilters['sortBy']) => void;
  onSortOrderChange: (order: TaskFilters['sortOrder']) => void;
  onReset: () => void;
  isFiltered: boolean;
}

const PRIORITIES: Array<{ value: Priority | 'all'; label: string }> = [
  { value: 'all',      label: 'All priorities' },
  { value: 'low',      label: 'Low' },
  { value: 'medium',   label: 'Medium' },
  { value: 'high',     label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const CATEGORIES: Array<{ value: Category | 'all'; label: string }> = [
  { value: 'all',      label: 'All categories' },
  { value: 'work',     label: 'Work' },
  { value: 'personal', label: 'Personal' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'health',   label: 'Health' },
  { value: 'other',    label: 'Other' },
];

const STATUSES: Array<{ value: Status | 'all'; label: string }> = [
  { value: 'all',         label: 'All statuses' },
  { value: 'todo',        label: 'To Do' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'done',        label: 'Done' },
];

const SORT_FIELDS: Array<{ value: TaskFilters['sortBy']; label: string }> = [
  { value: 'createdAt', label: 'Date created' },
  { value: 'dueDate',   label: 'Due date' },
  { value: 'priority',  label: 'Priority' },
  { value: 'title',     label: 'Title' },
];

/**
 * TaskFilter
 * ----------
 * A row of filter/sort controls that operate on the task list.
 * Each control is a simple <select> that calls back to the parent.
 */
export default function TaskFilter({
  filters,
  onPriorityChange,
  onCategoryChange,
  onStatusChange,
  onSortByChange,
  onSortOrderChange,
  onReset,
  isFiltered,
}: TaskFilterProps) {
  const selectClass =
    'rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';

  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Task filters">
      <select
        value={filters.priority}
        onChange={(e) => onPriorityChange(e.target.value as Priority | 'all')}
        aria-label="Filter by priority"
        className={selectClass}
        data-testid="priority-filter"
      >
        {PRIORITIES.map((p) => (
          <option key={p.value} value={p.value}>
            {p.label}
          </option>
        ))}
      </select>

      <select
        value={filters.category}
        onChange={(e) => onCategoryChange(e.target.value as Category | 'all')}
        aria-label="Filter by category"
        className={selectClass}
        data-testid="category-filter"
      >
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>

      <select
        value={filters.status}
        onChange={(e) => onStatusChange(e.target.value as Status | 'all')}
        aria-label="Filter by status"
        className={selectClass}
        data-testid="status-filter"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={filters.sortBy}
        onChange={(e) => onSortByChange(e.target.value as TaskFilters['sortBy'])}
        aria-label="Sort by"
        className={selectClass}
        data-testid="sort-by"
      >
        {SORT_FIELDS.map((f) => (
          <option key={f.value} value={f.value}>
            {f.label}
          </option>
        ))}
      </select>

      <button
        type="button"
        onClick={() =>
          onSortOrderChange(filters.sortOrder === 'asc' ? 'desc' : 'asc')
        }
        aria-label={`Sort ${filters.sortOrder === 'asc' ? 'descending' : 'ascending'}`}
        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm shadow-sm hover:bg-gray-50"
        data-testid="sort-order-toggle"
      >
        {filters.sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
      </button>

      {isFiltered && (
        <button
          type="button"
          onClick={onReset}
          className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm text-red-600 hover:bg-red-100"
          data-testid="reset-filters"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
