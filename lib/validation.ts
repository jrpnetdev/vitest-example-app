import { CreateTaskPayload, Priority, Category } from '@/types';

// ─── Constants ────────────────────────────────────────────────────────────────

export const VALID_PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];
export const VALID_CATEGORIES: Category[] = ['work', 'personal', 'shopping', 'health', 'other'];

export const TITLE_MIN_LENGTH = 3;
export const TITLE_MAX_LENGTH = 120;
export const DESCRIPTION_MAX_LENGTH = 1000;
export const MAX_TAGS = 10;
export const TAG_MAX_LENGTH = 30;

// ─── Result Type ──────────────────────────────────────────────────────────────

/** Returned by every validation helper — carries success flag and error messages. */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Convenience builder for a passing result. */
function pass(): ValidationResult {
  return { valid: true, errors: [] };
}

/** Convenience builder for a failing result with one or more messages. */
function fail(...errors: string[]): ValidationResult {
  return { valid: false, errors };
}

// ─── Field Validators ─────────────────────────────────────────────────────────

/**
 * Validates a task title.
 * Rules:
 *   - Must not be empty / whitespace-only.
 *   - Length must be between TITLE_MIN_LENGTH and TITLE_MAX_LENGTH characters.
 */
export function validateTitle(title: string | undefined | null): ValidationResult {
  if (!title || !title.trim()) {
    return fail('Title is required.');
  }
  const trimmed = title.trim();
  if (trimmed.length < TITLE_MIN_LENGTH) {
    return fail(`Title must be at least ${TITLE_MIN_LENGTH} characters.`);
  }
  if (trimmed.length > TITLE_MAX_LENGTH) {
    return fail(`Title must not exceed ${TITLE_MAX_LENGTH} characters.`);
  }
  return pass();
}

/**
 * Validates an optional description string.
 * When provided it must not exceed DESCRIPTION_MAX_LENGTH characters.
 */
export function validateDescription(desc: string | undefined | null): ValidationResult {
  if (!desc) return pass(); // optional field
  if (desc.length > DESCRIPTION_MAX_LENGTH) {
    return fail(`Description must not exceed ${DESCRIPTION_MAX_LENGTH} characters.`);
  }
  return pass();
}

/**
 * Validates a priority value against the allowed set.
 * Undefined is treated as "will be defaulted" and is therefore valid.
 */
export function validatePriority(priority: string | undefined | null): ValidationResult {
  if (!priority) return pass();
  if (!VALID_PRIORITIES.includes(priority as Priority)) {
    return fail(`Priority must be one of: ${VALID_PRIORITIES.join(', ')}.`);
  }
  return pass();
}

/**
 * Validates a category value against the allowed set.
 * Undefined is treated as "will be defaulted" and is therefore valid.
 */
export function validateCategory(category: string | undefined | null): ValidationResult {
  if (!category) return pass();
  if (!VALID_CATEGORIES.includes(category as Category)) {
    return fail(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`);
  }
  return pass();
}

/**
 * Validates an optional due date.
 * Rules:
 *   - Must be a parseable date string.
 *   - Must not be in the past.
 */
export function validateDueDate(dueDate: string | undefined | null): ValidationResult {
  if (!dueDate) return pass();
  const parsed = new Date(dueDate);
  if (isNaN(parsed.getTime())) {
    return fail('Due date is not a valid date.');
  }
  if (parsed < new Date()) {
    return fail('Due date must be in the future.');
  }
  return pass();
}

/**
 * Validates a tags array.
 * Rules:
 *   - Must not exceed MAX_TAGS tags.
 *   - Each tag must not exceed TAG_MAX_LENGTH characters.
 *   - Tags must not be blank.
 */
export function validateTags(tags: string[] | undefined | null): ValidationResult {
  if (!tags || tags.length === 0) return pass();
  if (tags.length > MAX_TAGS) {
    return fail(`A task may have at most ${MAX_TAGS} tags.`);
  }
  const errors: string[] = [];
  tags.forEach((tag, i) => {
    if (!tag.trim()) errors.push(`Tag at position ${i + 1} is blank.`);
    else if (tag.length > TAG_MAX_LENGTH)
      errors.push(`Tag "${tag}" exceeds ${TAG_MAX_LENGTH} characters.`);
  });
  return errors.length > 0 ? fail(...errors) : pass();
}

// ─── Composite Validator ──────────────────────────────────────────────────────

/**
 * Validates a full task creation payload, running every field validator
 * and collecting all errors in a single pass.
 *
 * Returns a combined ValidationResult whose `errors` array contains one
 * entry per failing field.
 */
export function validateTask(payload: Partial<CreateTaskPayload>): ValidationResult {
  const results = [
    validateTitle(payload.title),
    validateDescription(payload.description),
    validatePriority(payload.priority),
    validateCategory(payload.category),
    validateDueDate(payload.dueDate),
    validateTags(payload.tags),
  ];

  const allErrors = results.flatMap((r) => r.errors);
  return allErrors.length > 0 ? fail(...allErrors) : pass();
}

/**
 * Validates a basic email address string using a simple regex.
 * Not intended as a full RFC 5322 validator — use for quick UX feedback only.
 */
export function validateEmail(email: string): ValidationResult {
  if (!email.trim()) return fail('Email is required.');
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return fail('Email address is not valid.');
  return pass();
}
