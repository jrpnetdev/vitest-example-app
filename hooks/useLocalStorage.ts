'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * useLocalStorage<T>
 * ------------------
 * A generic hook that synchronises React state with localStorage.
 *
 * Features:
 *   - Reads the persisted value on first render (SSR-safe via lazy initialiser).
 *   - Writes back to localStorage on every state change.
 *   - Handles corrupt/missing JSON gracefully by falling back to the default.
 *   - Exposes a `remove` function for clearing the entry.
 *
 * @param key          The localStorage key.
 * @param defaultValue Used when no stored value exists or parsing fails.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T,
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Lazy initialiser — only runs once, avoids SSR mismatch.
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = window.localStorage.getItem(key);
      return item !== null ? (JSON.parse(item) as T) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Keep localStorage in sync whenever the value changes.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // Quota exceeded or private browsing — silently ignore.
    }
  }, [key, storedValue]);

  /** Accepts either a new value or an updater function (mirrors useState). */
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) =>
        typeof value === 'function' ? (value as (p: T) => T)(prev) : value,
      );
    },
    [],
  );

  /** Removes the item from localStorage and resets state to the default. */
  const remove = useCallback(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(key);
    }
    setStoredValue(defaultValue);
  }, [key, defaultValue]);

  return [storedValue, setValue, remove];
}
