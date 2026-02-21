/**
 * tests/components/StatsPanel.test.tsx
 * --------------------------------------
 * Component tests for components/StatsPanel.tsx
 *
 * Testing approach:
 *   - Verifies each stat card displays the correct numeric value.
 *   - Verifies the progress bar width reflects the completion rate.
 *   - Tests the aria attributes on the progress bar for accessibility.
 *   - Edge cases: 0% completion, 100% completion.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatsPanel from '@/components/StatsPanel';
import { TaskStats } from '@/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const STATS: TaskStats = {
  total: 10,
  byStatus: { todo: 4, 'in-progress': 3, done: 3 },
  byPriority: { low: 2, medium: 5, high: 2, critical: 1 },
  byCategory: { work: 4, personal: 3, shopping: 2, health: 1, other: 0 },
  overdue: 2,
  completionRate: 30,
};

const ZERO_STATS: TaskStats = {
  total: 0,
  byStatus: { todo: 0, 'in-progress': 0, done: 0 },
  byPriority: { low: 0, medium: 0, high: 0, critical: 0 },
  byCategory: { work: 0, personal: 0, shopping: 0, health: 0, other: 0 },
  overdue: 0,
  completionRate: 0,
};

const COMPLETE_STATS: TaskStats = {
  ...STATS,
  byStatus: { todo: 0, 'in-progress': 0, done: 10 },
  completionRate: 100,
};

// ── Stat Values ───────────────────────────────────────────────────────────────

describe('StatsPanel — stat card values', () => {
  it('displays the total task count', () => {
    render(<StatsPanel stats={STATS} />);
    const totalCard = screen.getByTestId('stat-total');
    expect(totalCard).toHaveTextContent('10');
  });

  it('displays the in-progress count', () => {
    render(<StatsPanel stats={STATS} />);
    expect(screen.getByTestId('stat-in-progress')).toHaveTextContent('3');
  });

  it('displays the done count', () => {
    render(<StatsPanel stats={STATS} />);
    expect(screen.getByTestId('stat-done')).toHaveTextContent('3');
  });

  it('displays the overdue count', () => {
    render(<StatsPanel stats={STATS} />);
    expect(screen.getByTestId('stat-overdue')).toHaveTextContent('2');
  });

  it('displays the completion rate percentage', () => {
    render(<StatsPanel stats={STATS} />);
    expect(screen.getByTestId('completion-rate')).toHaveTextContent('30%');
  });
});

// ── Progress Bar ──────────────────────────────────────────────────────────────

describe('StatsPanel — progress bar', () => {
  it('sets aria-valuenow to the completion rate', () => {
    render(<StatsPanel stats={STATS} />);
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '30');
  });

  it('sets aria-valuemin to 0 and aria-valuemax to 100', () => {
    render(<StatsPanel stats={STATS} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });
});

// ── Edge Cases ────────────────────────────────────────────────────────────────

describe('StatsPanel — edge cases', () => {
  it('renders correctly with all-zero stats', () => {
    render(<StatsPanel stats={ZERO_STATS} />);
    expect(screen.getByTestId('stat-total')).toHaveTextContent('0');
    expect(screen.getByTestId('completion-rate')).toHaveTextContent('0%');
  });

  it('renders correctly with 100% completion', () => {
    render(<StatsPanel stats={COMPLETE_STATS} />);
    expect(screen.getByTestId('completion-rate')).toHaveTextContent('100%');
  });

  it('applies red styling when there are overdue tasks', () => {
    render(<StatsPanel stats={STATS} />);
    const overdueCard = screen.getByTestId('stat-overdue');
    expect(overdueCard.className).toMatch(/red/);
  });

  it('does not apply red styling to overdue card when count is zero', () => {
    render(<StatsPanel stats={ZERO_STATS} />);
    const overdueCard = screen.getByTestId('stat-overdue');
    expect(overdueCard.className).not.toMatch(/red/);
  });
});

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('StatsPanel — accessibility', () => {
  it('is wrapped in a <section> with an aria-label', () => {
    render(<StatsPanel stats={STATS} />);
    expect(screen.getByRole('region', { name: 'Task statistics' })).toBeInTheDocument();
  });
});
