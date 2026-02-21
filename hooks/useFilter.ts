'use client';

import { useCallback, useState } from 'react';
import { TaskFilters, DEFAULT_FILTERS, Priority, Category, Status } from '@/types';

/**
 * useFilter
 * ---------
 * Manages the TaskFilters state object and exposes granular updaters
 * for each filter dimension so components don't need to spread state
 * themselves.
 *
 * Returns:
 *   filters     - Current filter values.
 *   setSearch   - Update the free-text search query.
 *   setPriority - Set the priority filter.
 *   setCategory - Set the category filter.
 *   setStatus   - Set the status filter.
 *   setSortBy   - Change the sort field.
 *   setSortOrder- Toggle or explicitly set sort direction.
 *   resetFilters- Reset everything back to defaults.
 */
export function useFilter() {
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);

  const setSearch = useCallback((search: string) => {
    setFilters((f) => ({ ...f, search }));
  }, []);

  const setPriority = useCallback((priority: Priority | 'all') => {
    setFilters((f) => ({ ...f, priority }));
  }, []);

  const setCategory = useCallback((category: Category | 'all') => {
    setFilters((f) => ({ ...f, category }));
  }, []);

  const setStatus = useCallback((status: Status | 'all') => {
    setFilters((f) => ({ ...f, status }));
  }, []);

  const setSortBy = useCallback((sortBy: TaskFilters['sortBy']) => {
    setFilters((f) => ({ ...f, sortBy }));
  }, []);

  const setSortOrder = useCallback((sortOrder: TaskFilters['sortOrder']) => {
    setFilters((f) => ({ ...f, sortOrder }));
  }, []);

  /** Toggles sort order between asc and desc. */
  const toggleSortOrder = useCallback(() => {
    setFilters((f) => ({ ...f, sortOrder: f.sortOrder === 'asc' ? 'desc' : 'asc' }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  /** True when any filter differs from the default (useful for "clear" button). */
  const isFiltered =
    filters.search !== DEFAULT_FILTERS.search ||
    filters.priority !== DEFAULT_FILTERS.priority ||
    filters.category !== DEFAULT_FILTERS.category ||
    filters.status !== DEFAULT_FILTERS.status;

  return {
    filters,
    setSearch,
    setPriority,
    setCategory,
    setStatus,
    setSortBy,
    setSortOrder,
    toggleSortOrder,
    resetFilters,
    isFiltered,
  };
}
