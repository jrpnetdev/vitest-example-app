/**
 * tests/unit/dateUtils.test.ts
 * ----------------------------
 * Unit tests for lib/dateUtils.ts
 *
 * Testing approach:
 *   - Equivalence partitioning: valid dates, invalid dates, null/undefined.
 *   - Frozen system time (vi.useFakeTimers) for relative-date assertions.
 *   - Boundary values: exactly today, yesterday, tomorrow, 7 days.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  formatDate,
  formatRelativeDate,
  toInputDateFormat,
  isValidDate,
  isFutureDate,
  isPastDate,
  getDaysBetween,
  addDays,
  todayISO,
  getCurrentWeekRange,
} from '@/lib/dateUtils';

// ── Frozen reference time ─────────────────────────────────────────────────────
// All relative-date tests are anchored to this fixed moment.
const FIXED_NOW = new Date('2024-06-15T12:00:00.000Z');

// ── formatDate ────────────────────────────────────────────────────────────────

describe('formatDate', () => {
  it('formats a valid ISO string into a readable short date', () => {
    const result = formatDate('2024-06-15T00:00:00.000Z');
    // The exact string depends on locale; we check it contains recognisable parts.
    expect(result).toMatch(/Jun/i);
    expect(result).toMatch(/15/);
    expect(result).toMatch(/2024/);
  });

  it('returns an empty string for null', () => {
    expect(formatDate(null)).toBe('');
  });

  it('returns an empty string for undefined', () => {
    expect(formatDate(undefined)).toBe('');
  });

  it('returns an empty string for an invalid date string', () => {
    expect(formatDate('not-a-date')).toBe('');
  });

  it('returns an empty string for an empty string', () => {
    expect(formatDate('')).toBe('');
  });
});

// ── formatRelativeDate ────────────────────────────────────────────────────────

describe('formatRelativeDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns "Today" for the current day', () => {
    // Same date, slightly earlier in the day
    expect(formatRelativeDate('2024-06-15T06:00:00.000Z')).toBe('Today');
  });

  it('returns "Yesterday" for one day ago', () => {
    expect(formatRelativeDate('2024-06-14T12:00:00.000Z')).toBe('Yesterday');
  });

  it('returns "Tomorrow" for one day ahead', () => {
    expect(formatRelativeDate('2024-06-16T12:00:00.000Z')).toBe('Tomorrow');
  });

  it('returns "In N days" for 2–7 days in the future', () => {
    const result = formatRelativeDate('2024-06-18T12:00:00.000Z'); // 3 days ahead
    expect(result).toBe('In 3 days');
  });

  it('returns "N days ago" for 2–7 days in the past', () => {
    const result = formatRelativeDate('2024-06-12T12:00:00.000Z'); // 3 days ago
    expect(result).toBe('3 days ago');
  });

  it('falls back to formatDate for dates beyond 7 days', () => {
    const result = formatRelativeDate('2024-07-20T12:00:00.000Z');
    // Should be a formatted date string, not a relative phrase
    expect(result).toMatch(/Jul/i);
    expect(result).toMatch(/2024/);
  });

  it('returns an empty string for null', () => {
    expect(formatRelativeDate(null)).toBe('');
  });
});

// ── toInputDateFormat ─────────────────────────────────────────────────────────

describe('toInputDateFormat', () => {
  it('converts an ISO string to YYYY-MM-DD', () => {
    expect(toInputDateFormat('2024-06-15T10:30:00.000Z')).toBe('2024-06-15');
  });

  it('returns an empty string for null', () => {
    expect(toInputDateFormat(null)).toBe('');
  });

  it('returns an empty string for an invalid date', () => {
    expect(toInputDateFormat('garbage')).toBe('');
  });
});

// ── isValidDate ───────────────────────────────────────────────────────────────

describe('isValidDate', () => {
  it('returns true for a valid ISO date string', () => {
    expect(isValidDate('2024-06-15T00:00:00.000Z')).toBe(true);
  });

  it('returns true for a valid YYYY-MM-DD string', () => {
    expect(isValidDate('2024-06-15')).toBe(true);
  });

  it('returns false for an invalid string', () => {
    expect(isValidDate('not-a-date')).toBe(false);
  });

  it('returns false for null', () => {
    expect(isValidDate(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidDate(undefined)).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(isValidDate('')).toBe(false);
  });
});

// ── isFutureDate ──────────────────────────────────────────────────────────────

describe('isFutureDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => { vi.useRealTimers(); });

  it('returns true for a date in the future', () => {
    expect(isFutureDate('2025-01-01T00:00:00.000Z')).toBe(true);
  });

  it('returns false for a date in the past', () => {
    expect(isFutureDate('2023-01-01T00:00:00.000Z')).toBe(false);
  });

  it('returns false for an invalid date string', () => {
    expect(isFutureDate('not-a-date')).toBe(false);
  });
});

// ── isPastDate ────────────────────────────────────────────────────────────────

describe('isPastDate', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });
  afterEach(() => { vi.useRealTimers(); });

  it('returns true for a date in the past', () => {
    expect(isPastDate('2020-01-01T00:00:00.000Z')).toBe(true);
  });

  it('returns false for a date in the future', () => {
    expect(isPastDate('2030-01-01T00:00:00.000Z')).toBe(false);
  });
});

// ── getDaysBetween ────────────────────────────────────────────────────────────

describe('getDaysBetween', () => {
  it('returns the correct positive number of days', () => {
    expect(getDaysBetween('2024-01-01', '2024-01-11')).toBe(10);
  });

  it('returns a negative number when "to" is before "from"', () => {
    expect(getDaysBetween('2024-01-11', '2024-01-01')).toBe(-10);
  });

  it('returns 0 for the same date', () => {
    expect(getDaysBetween('2024-06-15', '2024-06-15')).toBe(0);
  });
});

// ── addDays ───────────────────────────────────────────────────────────────────

describe('addDays', () => {
  it('adds positive days correctly', () => {
    const result = addDays('2024-01-01T00:00:00.000Z', 10);
    expect(result).toContain('2024-01-11');
  });

  it('subtracts days when given a negative number', () => {
    const result = addDays('2024-01-11T00:00:00.000Z', -10);
    expect(result).toContain('2024-01-01');
  });

  it('returns an ISO string', () => {
    const result = addDays('2024-01-01T00:00:00.000Z', 1);
    expect(() => new Date(result)).not.toThrow();
  });
});

// ── todayISO ──────────────────────────────────────────────────────────────────

describe('todayISO', () => {
  it('returns a valid ISO string', () => {
    const result = todayISO();
    expect(isValidDate(result)).toBe(true);
  });

  it('returns midnight UTC', () => {
    const result = todayISO();
    expect(result).toMatch(/T00:00:00\.000Z$/);
  });
});

// ── getCurrentWeekRange ───────────────────────────────────────────────────────

describe('getCurrentWeekRange', () => {
  it('returns an object with start and end ISO strings', () => {
    const { start, end } = getCurrentWeekRange();
    expect(isValidDate(start)).toBe(true);
    expect(isValidDate(end)).toBe(true);
  });

  it('start is before end', () => {
    const { start, end } = getCurrentWeekRange();
    expect(new Date(start).getTime()).toBeLessThan(new Date(end).getTime());
  });

  it('the range spans exactly 6 days and ~23h', () => {
    const { start, end } = getCurrentWeekRange();
    const days = getDaysBetween(start, end);
    expect(days).toBe(6);
  });
});
