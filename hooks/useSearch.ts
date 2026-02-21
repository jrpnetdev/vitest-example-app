'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * useSearch
 * ---------
 * Manages a debounced search query string.
 *
 * The `query` value updates immediately (for controlled input binding).
 * The `debouncedQuery` value updates only after the specified delay,
 * preventing excessive filtering on every keystroke.
 *
 * @param initialQuery  Starting search string (default: "").
 * @param delay         Debounce delay in milliseconds (default: 300 ms).
 */
export function useSearch(initialQuery = '', delay = 300) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear any pending timer when query or delay changes
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setDebouncedQuery(query);
    }, delay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, delay]);

  /** Clears both the live and debounced query values immediately. */
  const clearSearch = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setQuery('');
    setDebouncedQuery('');
  }, []);

  return { query, setQuery, debouncedQuery, clearSearch };
}
