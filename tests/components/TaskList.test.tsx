/**
 * tests/components/TaskList.test.tsx
 * ------------------------------------
 * Component tests for components/TaskList.tsx
 *
 * Testing approach:
 *   - Empty state: renders the correct empty-state UI when tasks array is empty.
 *   - Populated state: renders one TaskCard per task.
 *   - Handler propagation: verifies that callbacks are wired through to TaskCard.
 *   - Accessibility: list role, aria-label with correct count.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskList from '@/components/TaskList';
import { Task } from '@/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const BASE: Task = {
  id: '',
  title: '',
  priority: 'medium',
  category: 'work',
  status: 'todo',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: [],
};

const TASKS: Task[] = [
  { ...BASE, id: 'task_1', title: 'First task' },
  { ...BASE, id: 'task_2', title: 'Second task' },
  { ...BASE, id: 'task_3', title: 'Third task' },
];

const DEFAULT_HANDLERS = {
  onToggleStatus: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onDuplicate: vi.fn(),
};

function renderList(tasks: Task[], handlers = DEFAULT_HANDLERS) {
  return render(
    <TaskList
      tasks={tasks}
      onToggleStatus={handlers.onToggleStatus}
      onEdit={handlers.onEdit}
      onDelete={handlers.onDelete}
      onDuplicate={handlers.onDuplicate}
    />,
  );
}

// ── Empty State ───────────────────────────────────────────────────────────────

describe('TaskList — empty state', () => {
  it('renders the empty-state element when tasks is empty', () => {
    renderList([]);
    expect(screen.getByTestId('empty-state')).toBeInTheDocument();
  });

  it('does not render the task list when tasks is empty', () => {
    renderList([]);
    expect(screen.queryByTestId('task-list')).not.toBeInTheDocument();
  });

  it('shows a helpful message in the empty state', () => {
    renderList([]);
    expect(screen.getByText('No tasks found')).toBeInTheDocument();
  });
});

// ── Populated State ───────────────────────────────────────────────────────────

describe('TaskList — populated state', () => {
  it('renders the task list element when tasks are present', () => {
    renderList(TASKS);
    expect(screen.getByTestId('task-list')).toBeInTheDocument();
  });

  it('does not render the empty state when tasks are present', () => {
    renderList(TASKS);
    expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
  });

  it('renders exactly one card per task', () => {
    renderList(TASKS);
    expect(screen.getAllByTestId('task-card')).toHaveLength(TASKS.length);
  });

  it('renders each task title', () => {
    renderList(TASKS);
    TASKS.forEach((t) => {
      expect(screen.getByText(t.title)).toBeInTheDocument();
    });
  });
});

// ── Handler Propagation ───────────────────────────────────────────────────────

describe('TaskList — handler propagation', () => {
  it('wires onToggleStatus through to TaskCard', async () => {
    const handlers = { ...DEFAULT_HANDLERS, onToggleStatus: vi.fn() };
    renderList([TASKS[0]], handlers);
    await userEvent.click(screen.getByTestId('status-toggle'));
    expect(handlers.onToggleStatus).toHaveBeenCalledWith(TASKS[0].id);
  });

  it('wires onDelete through to TaskCard', async () => {
    const handlers = { ...DEFAULT_HANDLERS, onDelete: vi.fn() };
    renderList([TASKS[0]], handlers);
    await userEvent.click(screen.getByTestId('delete-button'));
    expect(handlers.onDelete).toHaveBeenCalledWith(TASKS[0].id);
  });

  it('wires onEdit through to TaskCard', async () => {
    const handlers = { ...DEFAULT_HANDLERS, onEdit: vi.fn() };
    renderList([TASKS[0]], handlers);
    await userEvent.click(screen.getByTestId('edit-button'));
    expect(handlers.onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: TASKS[0].id }),
    );
  });
});

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('TaskList — accessibility', () => {
  it('the list has role="list"', () => {
    renderList(TASKS);
    expect(screen.getByRole('list')).toBeInTheDocument();
  });

  it('the aria-label on the list reflects the task count', () => {
    renderList(TASKS);
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', '3 tasks');
  });

  it('the aria-label uses singular "task" for a single item', () => {
    renderList([TASKS[0]]);
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', '1 task');
  });

  it('the empty state has role="status"', () => {
    renderList([]);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
