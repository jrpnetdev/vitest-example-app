/**
 * tests/integration/taskWorkflow.test.tsx
 * ----------------------------------------
 * Integration tests that simulate a complete user workflow through
 * the rendered application components.
 *
 * Testing approach:
 *   - We render the full HomePage (which composes hooks + components).
 *   - userEvent drives realistic browser-like interactions.
 *   - These tests verify that multiple layers (state, UI, filters) work
 *     together correctly — not just in isolation.
 *   - localStorage is reset before each test to prevent cross-test pollution.
 *
 * Scope of integration:
 *   HomePage → useTasks + useFilter → TaskList → TaskCard
 *             → SearchBar → TaskFilter → TaskForm → StatsPanel
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import HomePage from '@/app/page';

beforeEach(() => {
  localStorage.clear();
});

// ── Task Creation Workflow ────────────────────────────────────────────────────

describe('Integration — task creation', () => {
  it('shows the task form when "+ New Task" is clicked', async () => {
    render(<HomePage />);
    await userEvent.click(screen.getByTestId('add-task-button'));
    expect(screen.getByTestId('task-form')).toBeInTheDocument();
  });

  it('creates a new task and displays it in the list', async () => {
    render(<HomePage />);

    // Open the form
    await userEvent.click(screen.getByTestId('add-task-button'));

    // Fill in the title
    await userEvent.type(screen.getByTestId('title-input'), 'Integration test task');

    // Submit
    await userEvent.click(screen.getByTestId('submit-button'));

    // The form should close
    await waitFor(() => {
      expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
    });

    // The new task title should appear in the list
    expect(screen.getByText('Integration test task')).toBeInTheDocument();
  });

  it('hides the form when Cancel is clicked', async () => {
    render(<HomePage />);
    await userEvent.click(screen.getByTestId('add-task-button'));
    await userEvent.click(screen.getByTestId('cancel-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('task-form')).not.toBeInTheDocument();
    });
  });

  it('shows a validation error when the form is submitted with an empty title', async () => {
    render(<HomePage />);
    await userEvent.click(screen.getByTestId('add-task-button'));
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      expect(screen.getByTestId('form-errors')).toBeInTheDocument();
    });
  });
});

// ── Task Status Toggle ────────────────────────────────────────────────────────

describe('Integration — task status toggling', () => {
  it('marks a task as in-progress when status button is clicked once', async () => {
    render(<HomePage />);

    // Add a task first
    await userEvent.click(screen.getByTestId('add-task-button'));
    await userEvent.type(screen.getByTestId('title-input'), 'Toggle me');
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() =>
      expect(screen.getByText('Toggle me')).toBeInTheDocument(),
    );

    // Click the status toggle — should go to 'in-progress'
    const cards = screen.getAllByTestId('task-card');
    // The newly created task is at position 0 (prepended)
    const newTaskCard = cards[0];
    const toggle = within(newTaskCard).getByTestId('status-toggle');
    await userEvent.click(toggle);

    await waitFor(() => {
      expect(within(newTaskCard).getByTestId('status-badge')).toHaveTextContent(
        'In Progress',
      );
    });
  });
});

// ── Task Deletion ─────────────────────────────────────────────────────────────

describe('Integration — task deletion', () => {
  it('removes a task from the list when the delete button is clicked', async () => {
    render(<HomePage />);

    // Add a task
    await userEvent.click(screen.getByTestId('add-task-button'));
    await userEvent.type(screen.getByTestId('title-input'), 'Doomed task');
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() =>
      expect(screen.getByText('Doomed task')).toBeInTheDocument(),
    );

    // Delete the task
    const cards = screen.getAllByTestId('task-card');
    await userEvent.click(within(cards[0]).getByTestId('delete-button'));

    await waitFor(() => {
      expect(screen.queryByText('Doomed task')).not.toBeInTheDocument();
    });
  });
});

// ── Task Editing ──────────────────────────────────────────────────────────────

describe('Integration — task editing', () => {
  it('pre-populates the form with existing data when edit is clicked', async () => {
    render(<HomePage />);

    // Add a task
    await userEvent.click(screen.getByTestId('add-task-button'));
    await userEvent.type(screen.getByTestId('title-input'), 'Original title');
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() =>
      expect(screen.getByText('Original title')).toBeInTheDocument(),
    );

    // Click edit on the first card
    const cards = screen.getAllByTestId('task-card');
    await userEvent.click(within(cards[0]).getByTestId('edit-button'));

    await waitFor(() =>
      expect(screen.getByTestId('task-form')).toBeInTheDocument(),
    );

    // Title field should be pre-filled
    expect(screen.getByTestId('title-input')).toHaveValue('Original title');
  });
});

// ── Search Integration ────────────────────────────────────────────────────────

describe('Integration — search and filter', () => {
  it('filters the visible task list as the user types in the search bar', async () => {
    render(<HomePage />);

    // Add two tasks with distinct titles
    await userEvent.click(screen.getByTestId('add-task-button'));
    await userEvent.type(screen.getByTestId('title-input'), 'React component');
    await userEvent.click(screen.getByTestId('submit-button'));

    await userEvent.click(screen.getByTestId('add-task-button'));
    await userEvent.type(screen.getByTestId('title-input'), 'Write Vitest tests');
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() =>
      expect(screen.getAllByTestId('task-card').length).toBeGreaterThanOrEqual(2),
    );

    // Type in the search bar
    await userEvent.type(screen.getByTestId('search-input'), 'Vitest');

    await waitFor(() => {
      // Only the "Write Vitest tests" card should be visible
      expect(screen.getByText('Write Vitest tests')).toBeInTheDocument();
      expect(screen.queryByText('React component')).not.toBeInTheDocument();
    });
  });

  it('clears the search filter when the clear button is clicked', async () => {
    render(<HomePage />);

    // Add a task
    await userEvent.click(screen.getByTestId('add-task-button'));
    await userEvent.type(screen.getByTestId('title-input'), 'Visible task');
    await userEvent.click(screen.getByTestId('submit-button'));

    // Apply search that hides the task
    await userEvent.type(screen.getByTestId('search-input'), 'xyz_no_match');

    await waitFor(() =>
      expect(screen.getByTestId('empty-state')).toBeInTheDocument(),
    );

    // Clear search
    await userEvent.click(screen.getByTestId('clear-search'));

    await waitFor(() => {
      expect(screen.queryByTestId('empty-state')).not.toBeInTheDocument();
      expect(screen.getByText('Visible task')).toBeInTheDocument();
    });
  });
});

// ── Stats Integration ─────────────────────────────────────────────────────────

describe('Integration — statistics', () => {
  it('increments the total stat when a task is added', async () => {
    render(<HomePage />);
    const initialTotal = parseInt(
      screen.getByTestId('stat-total').textContent ?? '0',
    );

    await userEvent.click(screen.getByTestId('add-task-button'));
    await userEvent.type(screen.getByTestId('title-input'), 'Stat test task');
    await userEvent.click(screen.getByTestId('submit-button'));

    await waitFor(() => {
      const newTotal = parseInt(
        screen.getByTestId('stat-total').textContent ?? '0',
      );
      expect(newTotal).toBe(initialTotal + 1);
    });
  });
});
