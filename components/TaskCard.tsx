import clsx from 'clsx';
import { Task } from '@/types';
import PriorityIndicator from './PriorityIndicator';
import CategoryBadge from './CategoryBadge';
import { formatRelativeDate } from '@/lib/dateUtils';
import { isTaskOverdue } from '@/lib/taskUtils';

interface TaskCardProps {
  task: Task;
  onToggleStatus: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'To Do',
  'in-progress': 'In Progress',
  done: 'Done',
};

/**
 * TaskCard
 * --------
 * Renders a single task as a card, displaying all relevant metadata and
 * providing action buttons for status toggling, editing, duplicating,
 * and deleting.
 */
export default function TaskCard({
  task,
  onToggleStatus,
  onEdit,
  onDelete,
  onDuplicate,
}: TaskCardProps) {
  const overdue = isTaskOverdue(task);
  const isDone = task.status === 'done';

  return (
    <article
      className={clsx(
        'rounded-xl border bg-white p-4 shadow-sm transition-all duration-200 hover:shadow-md',
        isDone && 'opacity-60',
        overdue && !isDone && 'border-red-300 bg-red-50',
      )}
      data-testid="task-card"
      aria-label={`Task: ${task.title}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {/* Status toggle checkbox */}
          <button
            type="button"
            onClick={() => onToggleStatus(task.id)}
            aria-label={`Mark task as ${isDone ? 'incomplete' : 'complete'}`}
            className={clsx(
              'flex-shrink-0 h-5 w-5 rounded border-2 transition-colors',
              isDone
                ? 'border-green-500 bg-green-500'
                : 'border-gray-300 hover:border-blue-400',
            )}
            data-testid="status-toggle"
          >
            {isDone && (
              <svg className="h-full w-full text-white" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          {/* Title */}
          <h3
            className={clsx(
              'font-semibold text-gray-800 truncate',
              isDone && 'line-through text-gray-400',
            )}
          >
            {task.title}
          </h3>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            type="button"
            onClick={() => onEdit(task)}
            aria-label="Edit task"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-testid="edit-button"
          >
            ✏️
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(task.id)}
            aria-label="Duplicate task"
            className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            data-testid="duplicate-button"
          >
            📋
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            aria-label="Delete task"
            className="rounded p-1 text-gray-400 hover:bg-red-100 hover:text-red-500"
            data-testid="delete-button"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="mt-2 text-sm text-gray-500 line-clamp-2" data-testid="task-description">
          {task.description}
        </p>
      )}

      {/* Meta row */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <PriorityIndicator priority={task.priority} />
        <CategoryBadge category={task.category} />

        {/* Status badge */}
        <span
          className="text-xs text-gray-500 bg-gray-100 rounded-full px-2 py-0.5"
          data-testid="status-badge"
        >
          {STATUS_LABELS[task.status]}
        </span>

        {/* Tags */}
        {task.tags.map((tag) => (
          <span
            key={tag}
            className="text-xs rounded-full bg-indigo-50 text-indigo-600 px-2 py-0.5"
            data-testid="task-tag"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* Footer: due date */}
      {task.dueDate && (
        <div
          className={clsx(
            'mt-2 text-xs',
            overdue && !isDone ? 'text-red-500 font-medium' : 'text-gray-400',
          )}
          data-testid="due-date"
        >
          {overdue && !isDone ? '⚠ Overdue · ' : '📅 '}
          {formatRelativeDate(task.dueDate)}
        </div>
      )}
    </article>
  );
}
