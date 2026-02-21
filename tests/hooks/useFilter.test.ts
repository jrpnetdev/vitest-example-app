/**
 * tests/hooks/useFilter.test.ts
 * ------------------------------
 * Tests for hooks/useFilter.ts
 *
 * Testing approach:
 *   - renderHook wraps the hook so we can call its returned functions.
 *   - Each setter is tested independently to verify it only touches the
 *     relevant filter field.
 *   - resetFilters is verified to restore all fields to defaults.
 *   - isFiltered derived value is tested with various filter combinations.
 */

import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFilter } from '@/hooks/useFilter';
import { DEFAULT_FILTERS } from '@/types';

describe('useFilter', () => {
  // ── Initial State ────────────────────────────────────────────────────────────

  it('initialises with default filters', () => {
    const { result } = renderHook(() => useFilter());
    expect(result.current.filters).toEqual(DEFAULT_FILTERS);
  });

  it('isFiltered is false on initial render', () => {
    const { result } = renderHook(() => useFilter());
    expect(result.current.isFiltered).toBe(false);
  });

  // ── Individual Setters ────────────────────────────────────────────────────────

  it('setSearch updates only the search field', () => {
    const { result } = renderHook(() => useFilter());
    act(() => result.current.setSearch('hello'));
    expect(result.current.filters.search).toBe('hello');
    expect(result.current.filters.priority).toBe(DEFAULT_FILTERS.priority);
  });

  it('setPriority updates only the priority field', () => {
    const { result } = renderHook(() => useFilter());
    act(() => result.current.setPriority('high'));
    expect(result.current.filters.priority).toBe('high');
    expect(result.current.filters.category).toBe(DEFAULT_FILTERS.category);
  });

  it('setCategory updates only the category field', () => {
    const { result } = renderHook(() => useFilter());
    act(() => result.current.setCategory('work'));
    expect(result.current.filters.category).toBe('work');
  });

  it('setStatus updates only the status field', () => {
    const { result } = renderHook(() => useFilter());
    act(() => result.current.setStatus('done'));
    expect(result.current.filters.status).toBe('done');
  });

  it('setSortBy updates only the sortBy field', () => {
    const { result } = renderHook(() => useFilter());
    act(() => result.current.setSortBy('priority'));
    expect(result.current.filters.sortBy).toBe('priority');
    expect(result.current.filters.sortOrder).toBe(DEFAULT_FILTERS.sortOrder);
  });

  it('setSortOrder updates only the sortOrder field', () => {
    const { result } = renderHook(() => useFilter());
    act(() => result.current.setSortOrder('asc'));
    expect(result.current.filters.sortOrder).toBe('asc');
  });

  it('toggleSortOrder flips asc → desc', () => {
    const { result } = renderHook(() => useFilter());
    // Default is 'desc'
    act(() => result.current.toggleSortOrder());
    expect(result.current.filters.sortOrder).toBe('asc');
  });

  it('toggleSortOrder flips desc → asc on second call', () => {
    const { result } = renderHook(() => useFilter());
    act(() => result.current.toggleSortOrder()); // → asc
    act(() => result.current.toggleSortOrder()); // → desc
    expect(result.current.filters.sortOrder).toBe('desc');
  });

  // ── isFiltered ────────────────────────────────────────────────────────────────

  it('isFiltered becomes true when search is non-empty', () => {
    const { result } = renderHook(() => useFilter());
    act(() => result.current.setSearch('query'));
    expect(result.current.isFiltered).toBe(true);
  });

  it('isFiltered becomes true when priority is not "all"', () => {
    const { result } = renderHook(() => useFilter());
    act(() => result.current.setPriority('high'));
    expect(result.current.isFiltered).toBe(true);
  });

  it('isFiltered is false when filters match defaults (sortOrder changed is ok)', () => {
    const { result } = renderHook(() => useFilter());
    // Changing sortBy/sortOrder does not count as "filtered"
    act(() => result.current.setSortBy('title'));
    expect(result.current.isFiltered).toBe(false);
  });

  // ── resetFilters ──────────────────────────────────────────────────────────────

  it('resetFilters restores all fields to defaults', () => {
    const { result } = renderHook(() => useFilter());
    act(() => {
      result.current.setSearch('hello');
      result.current.setPriority('critical');
      result.current.setCategory('work');
      result.current.setStatus('done');
    });
    act(() => result.current.resetFilters());
    expect(result.current.filters).toEqual(DEFAULT_FILTERS);
  });

  it('isFiltered becomes false after resetFilters', () => {
    const { result } = renderHook(() => useFilter());
    act(() => result.current.setSearch('something'));
    act(() => result.current.resetFilters());
    expect(result.current.isFiltered).toBe(false);
  });
});
