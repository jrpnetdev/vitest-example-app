import { Task } from '@/types';
import TaskCard from './TaskCard';

interface TaskListProps {
  tasks: Task[];
  onToggleStatus: (id: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
}

/**
 * TaskList
 * --------
 * Renders the filtered task array as a stack of TaskCard components,
 * or an empty-state message when no tasks match the current filters.
 */
export default function TaskList({
  tasks,
  onToggleStatus,
  onEdit,
  onDelete,
  onDuplicate,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 p-12 text-center"
        data-testid="empty-state"
        role="status"
        aria-live="polite"
      >
        <span className="text-4xl mb-3" aria-hidden>
          📭
        </span>
        <p className="text-gray-500 font-medium">No tasks found</p>
        <p className="text-sm text-gray-400 mt-1">
          Try adjusting your filters or create a new task.
        </p>
      </div>
    );
  }

  return (
    <ul
      className="space-y-3"
      role="list"
      aria-label={`${tasks.length} task${tasks.length === 1 ? '' : 's'}`}
      data-testid="task-list"
    >
      {tasks.map((task) => (
        <li key={task.id}>
          <TaskCard
            task={task}
            onToggleStatus={onToggleStatus}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
          />
        </li>
      ))}
    </ul>
  );
}
