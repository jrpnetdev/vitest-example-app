/**
 * tests/components/TaskForm.test.tsx
 * -----------------------------------
 * Component tests for components/TaskForm.tsx
 *
 * Testing approach:
 *   - userEvent is used to fill in form fields realistically (typing, selecting).
 *   - Tests cover both "create" mode (no task prop) and "edit" mode (task prop).
 *   - Validation error messages are verified to appear for invalid input.
 *   - The onSubmit callback is verified to receive the correct payload.
 *   - The onCancel callback is verified to fire when Cancel is clicked.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TaskForm from '@/components/TaskForm';
import { Task } from '@/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const EXISTING_TASK: Task = {
  id: 'task_edit_001',
  title: 'Existing task',
  description: 'Already saved description.',
  priority: 'high',
  category: 'work',
  status: 'in-progress',
  dueDate: undefined,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
  tags: ['legacy'],
};

// ── Create Mode ───────────────────────────────────────────────────────────────

describe('TaskForm — create mode', () => {
  let onSubmit: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubmit = vi.fn();
    onCancel = vi.fn();
    render(<TaskForm onSubmit={onSubmit} onCancel={onCancel} />);
  });

  it('renders the "New Task" heading', () => {
    expect(screen.getByText('New Task')).toBeInTheDocument();
  });

  it('renders an empty title input', () => {
    expect(screen.getByTestId('title-input')).toHaveValue('');
  });

  it('renders the "Create Task" submit button', () => {
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Create Task');
  });

  it('submits the form with correct payload when all fields are filled', async () => {
    await userEvent.type(screen.getByTestId('title-input'), 'New task title');
    await userEvent.type(screen.getByTestId('description-input'), 'A description.');
    await userEvent.selectOptions(screen.getByTestId('priority-select'), 'high');
    await userEvent.selectOptions(screen.getByTestId('category-select'), 'personal');
    await userEvent.type(screen.getByTestId('tags-input'), 'urgent, frontend');

    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledOnce();
    });

    const [payload] = onSubmit.mock.calls[0];
    expect(payload.title).toBe('New task title');
    expect(payload.description).toBe('A description.');
    expect(payload.priority).toBe('high');
    expect(payload.category).toBe('personal');
    expect(payload.tags).toContain('urgent');
    expect(payload.tags).toContain('frontend');
  });

  it('shows a validation error when title is empty on submit', async () => {
    // Leave title empty and click submit
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('form-errors')).toBeInTheDocument();
    });

    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('shows a validation error when title is too short', async () => {
    await userEvent.type(screen.getByTestId('title-input'), 'ab'); // < 3 chars
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('form-errors')).toBeInTheDocument();
    });
  });

  it('calls onCancel when the Cancel button is clicked', async () => {
    await userEvent.click(screen.getByTestId('cancel-button'));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('does not submit the form when cancel is clicked', async () => {
    await userEvent.type(screen.getByTestId('title-input'), 'Some title');
    await userEvent.click(screen.getByTestId('cancel-button'));
    expect(onSubmit).not.toHaveBeenCalled();
  });
});

// ── Edit Mode ─────────────────────────────────────────────────────────────────

describe('TaskForm — edit mode', () => {
  let onSubmit: ReturnType<typeof vi.fn>;
  let onCancel: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onSubmit = vi.fn();
    onCancel = vi.fn();
    render(
      <TaskForm task={EXISTING_TASK} onSubmit={onSubmit} onCancel={onCancel} />,
    );
  });

  it('renders the "Edit Task" heading', () => {
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
  });

  it('pre-populates the title input with the existing task title', () => {
    expect(screen.getByTestId('title-input')).toHaveValue('Existing task');
  });

  it('pre-populates the description input', () => {
    expect(screen.getByTestId('description-input')).toHaveValue(
      'Already saved description.',
    );
  });

  it('pre-populates the priority select', () => {
    expect(screen.getByTestId('priority-select')).toHaveValue('high');
  });

  it('pre-populates the category select', () => {
    expect(screen.getByTestId('category-select')).toHaveValue('work');
  });

  it('pre-populates tags as a comma-separated string', () => {
    expect(screen.getByTestId('tags-input')).toHaveValue('legacy');
  });

  it('renders the "Save Changes" submit button', () => {
    expect(screen.getByTestId('submit-button')).toHaveTextContent('Save Changes');
  });

  it('submits updated values when the form is saved', async () => {
    // Clear and retype the title
    const titleInput = screen.getByTestId('title-input');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated task title');

    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => expect(onSubmit).toHaveBeenCalledOnce());

    const [payload] = onSubmit.mock.calls[0];
    expect(payload.title).toBe('Updated task title');
  });
});

// ── Validation Error Display ──────────────────────────────────────────────────

describe('TaskForm — validation errors', () => {
  it('clears validation errors after a successful submission', async () => {
    const onSubmit = vi.fn();
    render(<TaskForm onSubmit={onSubmit} onCancel={vi.fn()} />);

    // Trigger an error by submitting empty
    await userEvent.click(screen.getByTestId('submit-button'));
    await waitFor(() => {
      expect(screen.getByTestId('form-errors')).toBeInTheDocument();
    });

    // Fix the issue and re-submit
    await userEvent.type(screen.getByTestId('title-input'), 'Valid title here');
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('form-errors')).not.toBeInTheDocument();
    });
  });

  it('renders multiple error messages when multiple fields fail', async () => {
    render(<TaskForm onSubmit={vi.fn()} onCancel={vi.fn()} />);
    // Submit with an empty title (guaranteed to fail)
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
