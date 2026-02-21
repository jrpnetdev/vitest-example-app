/**
 * tests/advanced/snapshots.test.tsx
 * -----------------------------------
 * Snapshot tests for UI components
 *
 * Purpose:
 *   Snapshot tests capture the rendered markup of a component at a point in
 *   time and fail if it changes unexpectedly in future runs. They are useful
 *   for:
 *     - Detecting accidental markup regressions.
 *     - Documenting the expected HTML structure of complex components.
 *     - Quickly verifying that a refactor did not change the DOM output.
 *
 * How to update snapshots:
 *   When you intentionally change a component's markup, run:
 *     vitest run --update-snapshots
 *   or press 'u' while in watch mode.
 *
 * Caveats:
 *   - Dynamic values like IDs and timestamps are replaced with stable
 *     fixtures so the snapshot doesn't change on every run.
 *   - Snapshot tests complement — not replace — behavioural tests.
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import TaskCard from '@/components/TaskCard';
import PriorityIndicator from '@/components/PriorityIndicator';
import CategoryBadge from '@/components/CategoryBadge';
import StatsPanel from '@/components/StatsPanel';
import SearchBar from '@/components/SearchBar';
import TaskList from '@/components/TaskList';
import { Task, TaskStats } from '@/types';

// ── Stable Fixtures ───────────────────────────────────────────────────────────
// We use fixed timestamps so snapshots don't change between runs.

const STABLE_TASK: Task = {
  id: 'snapshot_task_001',
  title: 'Write comprehensive tests',
  description: 'Cover unit, component, integration, and advanced scenarios.',
  priority: 'high',
  category: 'work',
  status: 'in-progress',
  dueDate: '2025-01-31T00:00:00.000Z',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-15T00:00:00.000Z',
  tags: ['testing', 'vitest'],
  assignee: 'dev@example.com',
};

const DONE_TASK: Task = { ...STABLE_TASK, id: 'snap_002', status: 'done', tags: [] };

const STABLE_STATS: TaskStats = {
  total: 8,
  byStatus: { todo: 3, 'in-progress': 2, done: 3 },
  byPriority: { low: 1, medium: 3, high: 3, critical: 1 },
  byCategory: { work: 4, personal: 2, shopping: 1, health: 1, other: 0 },
  overdue: 1,
  completionRate: 37,
};

const NO_OP = () => {};

// ── PriorityIndicator Snapshots ───────────────────────────────────────────────

describe('Snapshot — PriorityIndicator', () => {
  it('matches snapshot for each priority level (full badge)', () => {
    (['low', 'medium', 'high', 'critical'] as const).forEach((priority) => {
      const { container } = render(<PriorityIndicator priority={priority} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });

  it('matches snapshot for compact mode', () => {
    const { container } = render(<PriorityIndicator priority="critical" compact />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

// ── CategoryBadge Snapshots ───────────────────────────────────────────────────

describe('Snapshot — CategoryBadge', () => {
  it('matches snapshot for each category', () => {
    (['work', 'personal', 'shopping', 'health', 'other'] as const).forEach((category) => {
      const { container } = render(<CategoryBadge category={category} />);
      expect(container.firstChild).toMatchSnapshot();
    });
  });
});

// ── SearchBar Snapshots ───────────────────────────────────────────────────────

describe('Snapshot — SearchBar', () => {
  it('matches snapshot when empty', () => {
    const { container } = render(<SearchBar value="" onChange={NO_OP} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot when populated (with clear button)', () => {
    const { container } = render(<SearchBar value="hello world" onChange={NO_OP} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

// ── TaskCard Snapshots ────────────────────────────────────────────────────────

describe('Snapshot — TaskCard', () => {
  const handlers = {
    onToggleStatus: NO_OP,
    onEdit: NO_OP,
    onDelete: NO_OP,
    onDuplicate: NO_OP,
  };

  it('matches snapshot for a normal in-progress task', () => {
    const { container } = render(<TaskCard task={STABLE_TASK} {...handlers} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for a done task', () => {
    const { container } = render(<TaskCard task={DONE_TASK} {...handlers} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot for a task without description, tags, or due date', () => {
    const minimal: Task = {
      ...STABLE_TASK,
      id: 'snap_min',
      description: undefined,
      dueDate: undefined,
      tags: [],
    };
    const { container } = render(<TaskCard task={minimal} {...handlers} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

// ── StatsPanel Snapshots ──────────────────────────────────────────────────────

describe('Snapshot — StatsPanel', () => {
  it('matches snapshot with standard stats', () => {
    const { container } = render(<StatsPanel stats={STABLE_STATS} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with zero stats', () => {
    const zero: TaskStats = {
      total: 0,
      byStatus: { todo: 0, 'in-progress': 0, done: 0 },
      byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
      byCategory: { work: 0, personal: 0, shopping: 0, health: 0, other: 0 },
      overdue: 0,
      completionRate: 0,
    };
    const { container } = render(<StatsPanel stats={zero} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});

// ── TaskList Snapshots ────────────────────────────────────────────────────────

describe('Snapshot — TaskList', () => {
  const handlers = {
    onToggleStatus: NO_OP,
    onEdit: NO_OP,
    onDelete: NO_OP,
    onDuplicate: NO_OP,
  };

  it('matches snapshot for the empty state', () => {
    const { container } = render(<TaskList tasks={[]} {...handlers} />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('matches snapshot with two tasks', () => {
    const { container } = render(
      <TaskList tasks={[STABLE_TASK, DONE_TASK]} {...handlers} />,
    );
    expect(container.firstChild).toMatchSnapshot();
  });
});
