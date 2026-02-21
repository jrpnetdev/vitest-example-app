/**
 * tests/unit/validation.test.ts
 * ------------------------------
 * Unit tests for lib/validation.ts
 *
 * Testing approach:
 *   - Each validator is tested in isolation (single responsibility).
 *   - Boundary testing: exactly at min/max length limits.
 *   - Equivalence classes: valid input, invalid input, empty/null/undefined.
 *   - The composite validateTask function is tested for error aggregation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  validateTitle,
  validateDescription,
  validatePriority,
  validateCategory,
  validateDueDate,
  validateTags,
  validateTask,
  validateEmail,
  TITLE_MIN_LENGTH,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  MAX_TAGS,
  TAG_MAX_LENGTH,
} from '@/lib/validation';

// ── validateTitle ─────────────────────────────────────────────────────────────

describe('validateTitle', () => {
  it('passes for a valid title within length limits', () => {
    const result = validateTitle('Buy milk');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails for an empty string', () => {
    const result = validateTitle('');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/required/i);
  });

  it('fails for a whitespace-only string', () => {
    expect(validateTitle('   ').valid).toBe(false);
  });

  it('fails for null', () => {
    expect(validateTitle(null).valid).toBe(false);
  });

  it('fails for undefined', () => {
    expect(validateTitle(undefined).valid).toBe(false);
  });

  it(`fails when title is shorter than ${TITLE_MIN_LENGTH} chars`, () => {
    // Generate a string one character shorter than the minimum
    const tooShort = 'ab'; // 2 chars < 3
    const result = validateTitle(tooShort);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/at least/i);
  });

  it(`passes when title is exactly ${TITLE_MIN_LENGTH} chars (lower boundary)`, () => {
    const atMin = 'abc'; // exactly TITLE_MIN_LENGTH
    expect(validateTitle(atMin).valid).toBe(true);
  });

  it(`passes when title is exactly ${TITLE_MAX_LENGTH} chars (upper boundary)`, () => {
    const atMax = 'A'.repeat(TITLE_MAX_LENGTH);
    expect(validateTitle(atMax).valid).toBe(true);
  });

  it(`fails when title exceeds ${TITLE_MAX_LENGTH} chars`, () => {
    const tooLong = 'A'.repeat(TITLE_MAX_LENGTH + 1);
    const result = validateTitle(tooLong);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/not exceed/i);
  });
});

// ── validateDescription ───────────────────────────────────────────────────────

describe('validateDescription', () => {
  it('passes for undefined (optional field)', () => {
    expect(validateDescription(undefined).valid).toBe(true);
  });

  it('passes for null (optional field)', () => {
    expect(validateDescription(null).valid).toBe(true);
  });

  it('passes for a non-empty description within limits', () => {
    expect(validateDescription('A short description.').valid).toBe(true);
  });

  it(`passes when description is exactly ${DESCRIPTION_MAX_LENGTH} chars`, () => {
    expect(validateDescription('x'.repeat(DESCRIPTION_MAX_LENGTH)).valid).toBe(true);
  });

  it(`fails when description exceeds ${DESCRIPTION_MAX_LENGTH} chars`, () => {
    const tooLong = 'x'.repeat(DESCRIPTION_MAX_LENGTH + 1);
    const result = validateDescription(tooLong);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/not exceed/i);
  });
});

// ── validatePriority ──────────────────────────────────────────────────────────

describe('validatePriority', () => {
  it.each(['low', 'medium', 'high', 'critical'])('passes for valid priority "%s"', (p) => {
    expect(validatePriority(p).valid).toBe(true);
  });

  it('passes for undefined (will be defaulted)', () => {
    expect(validatePriority(undefined).valid).toBe(true);
  });

  it('fails for an unrecognised priority string', () => {
    expect(validatePriority('urgent').valid).toBe(false);
  });
});

// ── validateCategory ──────────────────────────────────────────────────────────

describe('validateCategory', () => {
  it.each(['work', 'personal', 'shopping', 'health', 'other'])(
    'passes for valid category "%s"',
    (c) => {
      expect(validateCategory(c).valid).toBe(true);
    },
  );

  it('passes for undefined (will be defaulted)', () => {
    expect(validateCategory(undefined).valid).toBe(true);
  });

  it('fails for an unrecognised category string', () => {
    expect(validateCategory('finance').valid).toBe(false);
  });
});

// ── validateDueDate ───────────────────────────────────────────────────────────

describe('validateDueDate', () => {
  const FIXED_NOW = new Date('2024-06-15T12:00:00.000Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_NOW);
  });

  afterEach(() => { vi.useRealTimers(); });

  it('passes for undefined (optional field)', () => {
    expect(validateDueDate(undefined).valid).toBe(true);
  });

  it('passes for a date in the future', () => {
    expect(validateDueDate('2025-01-01T00:00:00.000Z').valid).toBe(true);
  });

  it('fails for a date in the past', () => {
    const result = validateDueDate('2020-01-01T00:00:00.000Z');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/future/i);
  });

  it('fails for an invalid date string', () => {
    const result = validateDueDate('not-a-date');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/valid date/i);
  });
});

// ── validateTags ──────────────────────────────────────────────────────────────

describe('validateTags', () => {
  it('passes for undefined', () => {
    expect(validateTags(undefined).valid).toBe(true);
  });

  it('passes for an empty array', () => {
    expect(validateTags([]).valid).toBe(true);
  });

  it('passes for an array within limits', () => {
    expect(validateTags(['react', 'vitest', 'nextjs']).valid).toBe(true);
  });

  it(`fails when more than ${MAX_TAGS} tags are supplied`, () => {
    const tooMany = Array.from({ length: MAX_TAGS + 1 }, (_, i) => `tag${i}`);
    const result = validateTags(tooMany);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/at most/i);
  });

  it('fails when a tag is blank', () => {
    const result = validateTags(['valid', '   ']);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/blank/i);
  });

  it(`fails when a tag exceeds ${TAG_MAX_LENGTH} characters`, () => {
    const longTag = 'x'.repeat(TAG_MAX_LENGTH + 1);
    const result = validateTags([longTag]);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/exceeds/i);
  });
});

// ── validateTask (composite) ──────────────────────────────────────────────────

describe('validateTask', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-06-15T12:00:00.000Z'));
  });
  afterEach(() => { vi.useRealTimers(); });

  it('passes for a complete, valid payload', () => {
    const result = validateTask({
      title: 'Valid task title',
      priority: 'high',
      category: 'work',
      dueDate: '2025-01-01T00:00:00.000Z',
      tags: ['urgent'],
    });
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('fails and returns ALL errors when multiple fields are invalid', () => {
    // Two violations: empty title + invalid priority
    const result = validateTask({ title: '', priority: 'super-urgent' as never });
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it('fails when only the title is missing', () => {
    const result = validateTask({ priority: 'low', category: 'work' });
    expect(result.valid).toBe(false);
    expect(result.errors).toHaveLength(1);
  });

  it('passes with only a title (all other fields are optional)', () => {
    expect(validateTask({ title: 'Minimal task' }).valid).toBe(true);
  });
});

// ── validateEmail ─────────────────────────────────────────────────────────────

describe('validateEmail', () => {
  it.each([
    'user@example.com',
    'user.name+tag@sub.domain.org',
    'alice@company.co.uk',
  ])('passes for a valid email: %s', (email) => {
    expect(validateEmail(email).valid).toBe(true);
  });

  it('fails for an empty string', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toMatch(/required/i);
  });

  it.each(['not-an-email', 'missing@', '@nodomain.com', 'no spaces@domain.com'])(
    'fails for invalid email: %s',
    (email) => {
      expect(validateEmail(email).valid).toBe(false);
    },
  );
});
