/**
 * tests/components/SearchBar.test.tsx
 * -------------------------------------
 * Component tests for components/SearchBar.tsx
 *
 * Testing approach:
 *   - Controlled input: verifies that onChange is called with the typed value.
 *   - Clear button: conditionally visible; fires onChange('') when clicked.
 *   - Accessibility: aria roles and labels.
 *   - Keyboard interaction: typing via userEvent.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SearchBar from '@/components/SearchBar';

function renderSearchBar(value = '', onChange = vi.fn(), placeholder?: string) {
  return render(
    <SearchBar value={value} onChange={onChange} placeholder={placeholder} />,
  );
}

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('SearchBar — rendering', () => {
  it('renders a search input with the correct value', () => {
    renderSearchBar('react');
    expect(screen.getByTestId('search-input')).toHaveValue('react');
  });

  it('renders the default placeholder text', () => {
    renderSearchBar();
    expect(screen.getByTestId('search-input')).toHaveAttribute(
      'placeholder',
      'Search tasks…',
    );
  });

  it('renders a custom placeholder when provided', () => {
    renderSearchBar('', vi.fn(), 'Find something…');
    expect(screen.getByTestId('search-input')).toHaveAttribute(
      'placeholder',
      'Find something…',
    );
  });

  it('does NOT render the clear button when value is empty', () => {
    renderSearchBar('');
    expect(screen.queryByTestId('clear-search')).not.toBeInTheDocument();
  });

  it('renders the clear button when value is non-empty', () => {
    renderSearchBar('hello');
    expect(screen.getByTestId('clear-search')).toBeInTheDocument();
  });
});

// ── User Interactions ─────────────────────────────────────────────────────────

describe('SearchBar — user interactions', () => {
  let onChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onChange = vi.fn();
  });

  it('calls onChange with the typed characters', async () => {
    renderSearchBar('', onChange);
    await userEvent.type(screen.getByTestId('search-input'), 'hello');
    // onChange is called on every keystroke
    expect(onChange).toHaveBeenCalled();
    // Last call should pass the final character
    expect(onChange).toHaveBeenLastCalledWith('hello');
  });

  it('calls onChange with an empty string when the clear button is clicked', async () => {
    renderSearchBar('existing query', onChange);
    await userEvent.click(screen.getByTestId('clear-search'));
    expect(onChange).toHaveBeenCalledWith('');
  });
});

// ── Accessibility ─────────────────────────────────────────────────────────────

describe('SearchBar — accessibility', () => {
  it('has a search landmark role', () => {
    renderSearchBar();
    expect(screen.getByRole('search')).toBeInTheDocument();
  });

  it('input has an accessible label', () => {
    renderSearchBar();
    expect(screen.getByLabelText('Search tasks')).toBeInTheDocument();
  });

  it('clear button has an accessible label', () => {
    renderSearchBar('query');
    expect(screen.getByLabelText('Clear search')).toBeInTheDocument();
  });
});
