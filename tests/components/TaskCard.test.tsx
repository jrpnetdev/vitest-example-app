/**
 * tests/components/TaskCard.test.tsx
 * -----------------------------------
 * Component tests for components/TaskCard.tsx
 *
 * Testing approach:
 *   - render() + screen queries from @testing-library/react.
 *   - userEvent for simulating realistic user interactions (click, keyboard).
 *   - Snapshot testing for regression detection of the rendered markup.
 *   - Conditional rendering: overdue state, done state, optional fields.
 *   - Callback spy verification (vi.fn()) to ensure handlers are called with
 *     the correct arguments.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskCard from '@/components/TaskCard';
import { Task } from '@/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const MOCK_TASK: Task = {
  id: 'task_001',
  title: 'Implement dark mode',
  description: 'Add a dark theme toggle to the settings page.',
  priority: 'high',
  category: 'work',
  status: 'in-progress',
  dueDate: new Date(Date.now() + 86400000).toISOString(), // tomorrow
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  tags: ['frontend', 'ux'],
};

// Default mock handlers — replaced per-test with vi.fn() spies as needed.
const DEFAULT_HANDLERS = {
  onToggleStatus: vi.fn(),
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onDuplicate: vi.fn(),
};

function renderCard(task: Partial<Task> = {}, handlers = DEFAULT_HANDLERS) {
  return render(
    <TaskCard
      task={{ ...MOCK_TASK, ...task }}
      onToggleStatus={handlers.onToggleStatus}
      onEdit={handlers.onEdit}
      onDelete={handlers.onDelete}
      onDuplicate={handlers.onDuplicate}
    />,
  );
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('TaskCard — rendering', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders the task title', () => {
    renderCard();
    expect(screen.getByText('Implement dark mode')).toBeInTheDocument();
  });

  it('renders the description when provided', () => {
    renderCard();
    expect(screen.getByTestId('task-description')).toHaveTextContent(
      'Add a dark theme toggle to the settings page.',
    );
  });

  it('does not render the description element when description is absent', () => {
    renderCard({ description: undefined });
    expect(screen.queryByTestId('task-description')).not.toBeInTheDocument();
  });

  it('renders the priority badge', () => {
    renderCard();
    expect(screen.getByTestId('priority-badge')).toBeInTheDocument();
    expect(screen.getByTestId('priority-badge')).toHaveTextContent('High');
  });

  it('renders the category badge', () => {
    renderCard();
    expect(screen.getByTestId('category-badge')).toHaveTextContent('Work');
  });

  it('renders the status badge', () => {
    renderCard();
    expect(screen.getByTestId('status-badge')).toHaveTextContent('In Progress');
  });

  it('renders all tags', () => {
    renderCard();
    const tags = screen.getAllByTestId('task-tag');
    expect(tags).toHaveLength(2);
    expect(tags[0]).toHaveTextContent('frontend');
    expect(tags[1]).toHaveTextContent('ux');
  });

  it('does not render any tag elements when tags array is empty', () => {
    renderCard({ tags: [] });
    expect(screen.queryAllByTestId('task-tag')).toHaveLength(0);
  });

  it('renders the due date', () => {
    renderCard();
    expect(screen.getByTestId('due-date')).toBeInTheDocument();
  });

  it('does not render the due date element when dueDate is absent', () => {
    renderCard({ dueDate: undefined });
    expect(screen.queryByTestId('due-date')).not.toBeInTheDocument();
  });
});

// ── Done State ────────────────────────────────────────────────────────────────

describe('TaskCard — done state', () => {
  it('applies opacity styling when task is done', () => {
    renderCard({ status: 'done' });
    // The article element should have the opacity class
    const card = screen.getByTestId('task-card');
    expect(card.className).toMatch(/opacity/);
  });

  it('shows a checked status toggle button when task is done', () => {
    renderCard({ status: 'done' });
    expect(screen.getByLabelText('Mark task as incomplete')).toBeInTheDocument();
  });

  it('applies line-through to the title when task is done', () => {
    renderCard({ status: 'done' });
    const title = screen.getByText('Implement dark mode');
    expect(title.className).toMatch(/line-through/);
  });
});

// ── Overdue State ─────────────────────────────────────────────────────────────

describe('TaskCard — overdue state', () => {
  it('applies red border when task is overdue', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString(); // yesterday
    renderCard({ dueDate: pastDate, status: 'todo' });
    const card = screen.getByTestId('task-card');
    expect(card.className).toMatch(/border-red/);
  });

  it('does not apply overdue styling for a done task even if past due', () => {
    const pastDate = new Date(Date.now() - 86400000).toISOString();
    renderCard({ dueDate: pastDate, status: 'done' });
    const card = screen.getByTestId('task-card');
    expect(card.className).not.toMatch(/border-red/);
  });
});

// ── User Interactions ─────────────────────────────────────────────────────────

describe('TaskCard — user interactions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls onToggleStatus with the task id when the status button is clicked', async () => {
    const handlers = { ...DEFAULT_HANDLERS, onToggleStatus: vi.fn() };
    renderCard({}, handlers);
    await userEvent.click(screen.getByTestId('status-toggle'));
    expect(handlers.onToggleStatus).toHaveBeenCalledOnce();
    expect(handlers.onToggleStatus).toHaveBeenCalledWith(MOCK_TASK.id);
  });

  it('calls onEdit with the full task object when the edit button is clicked', async () => {
    const handlers = { ...DEFAULT_HANDLERS, onEdit: vi.fn() };
    renderCard({}, handlers);
    await userEvent.click(screen.getByTestId('edit-button'));
    expect(handlers.onEdit).toHaveBeenCalledOnce();
    expect(handlers.onEdit).toHaveBeenCalledWith(
      expect.objectContaining({ id: MOCK_TASK.id }),
    );
  });

  it('calls onDelete with the task id when the delete button is clicked', async () => {
    const handlers = { ...DEFAULT_HANDLERS, onDelete: vi.fn() };
    renderCard({}, handlers);
    await userEvent.click(screen.getByTestId('delete-button'));
    expect(handlers.onDelete).toHaveBeenCalledWith(MOCK_TASK.id);
  });

  it('calls onDuplicate with the task id when the duplicate button is clicked', async () => {
    const handlers = { ...DEFAULT_HANDLERS, onDuplicate: vi.fn() };
    renderCard({}, handlers);
    await userEvent.click(screen.getByTestId('duplicate-button'));
    expect(handlers.onDuplicate).toHaveBeenCalledWith(MOCK_TASK.id);
  });
});

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('TaskCard — accessibility', () => {
  it('uses an <article> element with an aria-label', () => {
    renderCard();
    expect(screen.getByRole('article')).toHaveAttribute(
      'aria-label',
      `Task: ${MOCK_TASK.title}`,
    );
  });

  it('status toggle has a descriptive aria-label for incomplete tasks', () => {
    renderCard({ status: 'todo' });
    expect(screen.getByLabelText('Mark task as complete')).toBeInTheDocument();
  });

  it('edit button has an aria-label', () => {
    renderCard();
    expect(screen.getByLabelText('Edit task')).toBeInTheDocument();
  });

  it('delete button has an aria-label', () => {
    renderCard();
    expect(screen.getByLabelText('Delete task')).toBeInTheDocument();
  });
});

// ── Snapshot ──────────────────────────────────────────────────────────────────

describe('TaskCard — snapshot', () => {
  it('matches the snapshot for a standard task', () => {
    // Snapshot testing catches unintended markup regressions.
    // Update with `vitest --update` when intentional UI changes are made.
    const { container } = renderCard();
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches the snapshot for a done task', () => {
    const { container } = renderCard({ status: 'done' });
    expect(container.firstChild).toMatchSnapshot();
  });
});
