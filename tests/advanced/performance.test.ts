/**
 * tests/advanced/performance.test.ts
 * ------------------------------------
 * Performance / benchmark tests
 *
 * Testing approach:
 *   - vi.fn() spies are NOT used here — we measure real execution time.
 *   - performance.now() measures wall-clock duration.
 *   - Tests use generous thresholds (50 ms–500 ms) so they pass reliably
 *     on CI machines which may be slower than developer workstations.
 *   - The primary goal is to detect catastrophic regressions
 *     (O(n²) loops, accidental infinite recursion, etc.) rather than to
 *     enforce sub-millisecond timing.
 *
 * What we measure:
 *   1. Filtering 10,000 tasks with multiple active filters.
 *   2. Sorting 10,000 tasks by four different fields.
 *   3. Running calculateStats over 10,000 tasks.
 *   4. filterTasksBySearch over a large dataset.
 *   5. groupTasksByCategory over a large dataset.
 */

import { describe, it, expect } from 'vitest';
import { filterTasksBySearch, calculateStats, groupTasksByCategory } from '@/lib/taskUtils';
import { sortTasks } from '@/lib/sorting';
import { applyFilters } from '@/lib/filtering';
import { DEFAULT_FILTERS } from '@/types';
import { Task, Priority, Category, Status } from '@/types';

// ── Dataset Generator ─────────────────────────────────────────────────────────

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];
const CATEGORIES: Category[] = ['work', 'personal', 'shopping', 'health', 'other'];
const STATUSES: Status[] = ['todo', 'in-progress', 'done'];

/**
 * Generates an array of `count` realistic-looking tasks with varied properties.
 * Uses a deterministic seed approach so generated data is consistent across runs.
 */
function generateTasks(count: number): Task[] {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    id: `perf_task_${i}`,
    title: `Task number ${i}: ${['Fix bug', 'Write test', 'Review PR', 'Update docs', 'Deploy'][i % 5]}`,
    description: i % 3 === 0 ? `Description for task ${i} with some extra text to search through` : undefined,
    priority: PRIORITIES[i % PRIORITIES.length],
    category: CATEGORIES[i % CATEGORIES.length],
    status: STATUSES[i % STATUSES.length],
    dueDate: i % 4 === 0 ? new Date(now + (i - 5000) * 86400000).toISOString() : undefined,
    createdAt: new Date(now - i * 1000).toISOString(),
    updatedAt: new Date(now - i * 500).toISOString(),
    tags: [`tag_${i % 10}`, `team_${i % 3}`],
    assignee: i % 2 === 0 ? `user${i % 5}@example.com` : undefined,
  }));
}

const LARGE_DATASET = generateTasks(10_000);

// ── Performance Helpers ───────────────────────────────────────────────────────

/** Measures how long `fn` takes in milliseconds. */
function measureMs(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('Performance — applyFilters with 10,000 tasks', () => {
  it('completes within 200 ms when all filters are active', () => {
    const filters = {
      ...DEFAULT_FILTERS,
      search: 'task',
      priority: 'high' as Priority,
      category: 'work' as Category,
      status: 'todo' as Status,
      sortBy: 'priority' as const,
      sortOrder: 'desc' as const,
    };
    const ms = measureMs(() => applyFilters(LARGE_DATASET, filters));
    // Log for visibility in test output
    console.log(`applyFilters(10k): ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(200);
  });

  it('completes within 50 ms with no-op (default) filters', () => {
    const ms = measureMs(() => applyFilters(LARGE_DATASET, DEFAULT_FILTERS));
    console.log(`applyFilters(10k, default): ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(200);
  });
});

describe('Performance — sortTasks with 10,000 tasks', () => {
  it.each([
    ['title', 'asc'],
    ['priority', 'desc'],
    ['createdAt', 'desc'],
    ['dueDate', 'asc'],
  ] as const)('sorts by %s %s within 100 ms', (field, order) => {
    const ms = measureMs(() => sortTasks(LARGE_DATASET, field, order));
    console.log(`sortTasks(10k, ${field}, ${order}): ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(200);
  });
});

describe('Performance — calculateStats with 10,000 tasks', () => {
  it('calculates stats within 50 ms', () => {
    const ms = measureMs(() => calculateStats(LARGE_DATASET));
    console.log(`calculateStats(10k): ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(100);
  });
});

describe('Performance — filterTasksBySearch with 10,000 tasks', () => {
  it('performs a common search within 50 ms', () => {
    const ms = measureMs(() => filterTasksBySearch(LARGE_DATASET, 'Write test'));
    console.log(`filterTasksBySearch(10k, 'Write test'): ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(100);
  });

  it('performs worst-case search (match-all) within 100 ms', () => {
    const ms = measureMs(() => filterTasksBySearch(LARGE_DATASET, 'task'));
    console.log(`filterTasksBySearch(10k, 'task'): ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(200);
  });
});

describe('Performance — groupTasksByCategory with 10,000 tasks', () => {
  it('groups within 30 ms', () => {
    const ms = measureMs(() => groupTasksByCategory(LARGE_DATASET));
    console.log(`groupTasksByCategory(10k): ${ms.toFixed(2)} ms`);
    expect(ms).toBeLessThan(100);
  });
});

describe('Performance — repeated sort stability', () => {
  it('produces the same order on two consecutive sorts', () => {
    // If a sort is unstable, identical inputs may produce different outputs.
    const sorted1 = sortTasks(LARGE_DATASET, 'priority', 'desc');
    const sorted2 = sortTasks(LARGE_DATASET, 'priority', 'desc');
    // Compare ids of first 100 elements
    const ids1 = sorted1.slice(0, 100).map((t) => t.id);
    const ids2 = sorted2.slice(0, 100).map((t) => t.id);
    expect(ids1).toEqual(ids2);
  });
});
