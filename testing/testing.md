# TaskFlow — Testing Guide

> A comprehensive reference for the testing strategy, tools, patterns, and
> conventions used in the **TaskFlow** Next.js application.

---

## Table of Contents

1. [Philosophy & Goals](#1-philosophy--goals)
2. [Tech Stack](#2-tech-stack)
3. [Directory Structure](#3-directory-structure)
4. [Test Types Explained](#4-test-types-explained)
5. [Running the Tests](#5-running-the-tests)
6. [Coverage](#6-coverage)
7. [Test Patterns & Recipes](#7-test-patterns--recipes)
8. [Mocking Strategy](#8-mocking-strategy)
9. [Snapshot Testing](#9-snapshot-testing)
10. [Performance Testing](#10-performance-testing)
11. [Hook Testing](#11-hook-testing)
12. [API Route Testing](#12-api-route-testing)
13. [Integration Testing](#13-integration-testing)
14. [Advanced Topics](#14-advanced-topics)
15. [CI/CD Integration](#15-cicd-integration)
16. [Common Pitfalls](#16-common-pitfalls)
17. [Glossary](#17-glossary)

---

## 1. Philosophy & Goals

### The Testing Pyramid

We follow the classic **testing pyramid** model:

```
        ▲
       /E2E\          (few — slow, expensive)
      /──────\
     /  Integ \       (moderate — test component interactions)
    /────────────\
   /  Unit Tests  \   (many — fast, isolated, cheap)
  /────────────────\
```

- **Unit tests** make up the majority of the suite. They test a single function
  or module in complete isolation and run in milliseconds.
- **Integration tests** verify that multiple layers (hooks + components + state)
  work together correctly when composed.
- **End-to-end tests** (not included here) would run in a real browser against
  a running server and test complete user journeys.

### Design Principles

| Principle | Explanation |
|-----------|-------------|
| **Isolated** | Each test cleans up after itself. No shared mutable state between tests. |
| **Deterministic** | Tests produce the same result every time, on any machine. Time and randomness are controlled via fakes. |
| **Fast** | Unit and component tests complete in < 100 ms individually. The full suite runs in < 30 s. |
| **Readable** | Test names are full sentences that describe behaviour, not implementation details. |
| **Maintainable** | Tests are co-located by concern (unit/component/hook/api/integration/advanced) and heavily commented. |

---

## 2. Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [Vitest](https://vitest.dev/) | ^1.3 | Test runner, assertion library, mocking, coverage |
| [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) | ^14 | React component rendering and queries |
| [@testing-library/user-event](https://testing-library.com/docs/user-event/intro/) | ^14 | Realistic user interaction simulation |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) | ^6 | Extended DOM matchers (`toBeInTheDocument`, `toHaveValue`, etc.) |
| [jsdom](https://github.com/jsdom/jsdom) | ^24 | Browser environment emulation in Node |
| [@vitest/coverage-v8](https://vitest.dev/guide/coverage) | ^1.3 | V8-based code coverage |
| [@vitest/ui](https://vitest.dev/guide/ui) | ^1.3 | Browser-based test UI dashboard |

### Why Vitest over Jest?

- **Native ESM & TypeScript** support without extra Babel transforms.
- **Vite-powered** — uses the same fast bundler as the development server.
- **Compatible API** — `describe`, `it`, `expect` are identical to Jest, making
  migration straightforward.
- **Parallel execution** by default — tests run concurrently across worker
  threads.
- **Better watch mode** — only re-runs tests affected by changed files.

---

## 3. Directory Structure

```
tests/
├── setup.ts                      # Global setup (jest-dom, localStorage reset)
│
├── unit/                         # Pure function tests
│   ├── taskUtils.test.ts         # createTask, updateTask, calculateStats, …
│   ├── dateUtils.test.ts         # formatDate, formatRelativeDate, addDays, …
│   ├── validation.test.ts        # validateTitle, validateTask, validateEmail, …
│   ├── sorting.test.ts           # sortTasks, multiSort, comparators, …
│   └── filtering.test.ts         # filterByPriority, applyFilters, …
│
├── components/                   # React component tests
│   ├── TaskCard.test.tsx         # Rendering, interaction, overdue, done state
│   ├── TaskForm.test.tsx         # Create / edit modes, validation display
│   ├── TaskList.test.tsx         # Empty state, populated, handler wiring
│   ├── SearchBar.test.tsx        # Controlled input, clear button
│   └── StatsPanel.test.tsx       # Stat values, progress bar, edge cases
│
├── hooks/                        # React hook tests
│   ├── useLocalStorage.test.ts   # Persistence, defaults, error resilience
│   ├── useFilter.test.ts         # Individual setters, isFiltered, reset
│   ├── useTasks.test.ts          # CRUD, filteredTasks, stats derivation
│   └── useSearch.test.ts         # Debounce behaviour, clearSearch
│
├── api/                          # Next.js API route tests
│   └── tasks.test.ts             # GET, POST — success and error paths
│
├── integration/                  # Cross-layer workflow tests
│   └── taskWorkflow.test.tsx     # Full create/edit/delete/filter user journeys
│
└── advanced/                     # Advanced testing techniques
    ├── performance.test.ts       # Timing benchmarks with large datasets
    ├── edgeCases.test.ts         # Boundary, Unicode, long strings, dates
    ├── mocking.test.ts           # vi.fn, spyOn, fetch, localStorage, timers
    ├── concurrent.test.ts        # Promise.all, race conditions, retry logic
    └── snapshots.test.tsx        # UI snapshot regression tests

testing/
└── testing.md                    # ← This document
```

---

## 4. Test Types Explained

### 4.1 Unit Tests

Unit tests verify a **single function** or **module** in complete isolation.
All external dependencies (other modules, time, randomness) are either irrelevant
or explicitly controlled.

**Characteristics:**
- Fast (< 5 ms per test)
- No DOM, no network, no filesystem
- Input → output assertions only

**Example — testing `createTask`:**

```typescript
it('defaults status to "todo"', () => {
  const task = createTask({ title: 'Any task' });
  expect(task.status).toBe('todo');
});
```

**When to write unit tests:**
- Every pure utility function in `lib/`.
- Edge cases and boundary values for validation functions.
- Priority/category/status comparators and transformers.

---

### 4.2 Component Tests

Component tests render a React component into a virtual DOM (jsdom) and verify
its **rendered output** and **user interaction behaviour**.

The golden rule: **test behaviour, not implementation**. Query by role, label,
or test-id — never by CSS class or internal state.

**Characteristics:**
- Moderate speed (jsdom rendering takes a few milliseconds)
- Requires `@testing-library/react` and `@testing-library/user-event`
- Tests the public interface (props, emitted events)

**Example — testing a click handler:**

```typescript
it('calls onToggleStatus with the task id when status button is clicked', async () => {
  const onToggleStatus = vi.fn();
  render(<TaskCard task={TASK} onToggleStatus={onToggleStatus} ... />);
  await userEvent.click(screen.getByTestId('status-toggle'));
  expect(onToggleStatus).toHaveBeenCalledWith(TASK.id);
});
```

**Query priority (Testing Library recommendation):**

1. `getByRole` (most accessible, preferred)
2. `getByLabelText`
3. `getByPlaceholderText`
4. `getByText`
5. `getByDisplayValue`
6. `getByTestId` (last resort — only when semantic queries don't apply)

---

### 4.3 Hook Tests

Custom React hooks are tested using `renderHook()` from `@testing-library/react`.
All state mutations are wrapped in `act()` to ensure React processes them before
assertions run.

**Example:**

```typescript
it('updates the stored value when setValue is called', () => {
  const { result } = renderHook(() => useLocalStorage('key', 'initial'));
  act(() => { result.current[1]('updated'); });
  expect(result.current[0]).toBe('updated');
});
```

---

### 4.4 API Route Tests

Next.js 14 App Router handlers are **plain async functions** that accept a
`NextRequest` and return a `NextResponse`. This means we can test them
**without spinning up an HTTP server** — we call them like any other async
function.

```typescript
it('returns 201 for a valid payload', async () => {
  const req = new NextRequest('http://localhost/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: 'Test task' }),
  });
  const res = await POST(req);
  expect(res.status).toBe(201);
});
```

**Module isolation:** The in-memory `taskStore` is a module-level variable. We
reset it between tests using `vi.resetModules()` + dynamic `import()` to get a
fresh module instance.

---

### 4.5 Integration Tests

Integration tests render the **full page component** (which composes all hooks
and presentational components) and drive it with `userEvent` to simulate
realistic multi-step user workflows.

**Covered workflows:**
- Task creation (open form → fill → submit → appear in list)
- Task status toggling (click → badge updates)
- Task deletion (click delete → removed from list)
- Task editing (click edit → form pre-populated → save → updated in list)
- Search filtering (type → list filtered → clear → list restored)
- Statistics update (add task → total increments)

These tests are intentionally slower than unit tests and catch bugs that arise
from incorrect wiring between hooks and components.

---

### 4.6 Snapshot Tests

Snapshot tests capture the **serialised DOM output** of a component on first
run and save it to a `__snapshots__/` directory. Future runs compare against
this baseline.

```typescript
it('matches the snapshot', () => {
  const { container } = render(<TaskCard task={STABLE_TASK} ... />);
  expect(container.firstChild).toMatchSnapshot();
});
```

**When to update snapshots:**

```bash
# CLI flag
vitest run --update-snapshots

# In watch mode
Press 'u' to update failing snapshots
```

⚠️ **Important:** Only update snapshots when you **intentionally** changed the
component. A snapshot update in a PR should always be accompanied by a clear
explanation of the visual change.

---

### 4.7 Performance Tests

Performance tests measure the **wall-clock execution time** of critical
operations on large datasets and fail if they exceed a defined threshold.

```typescript
it('filters 10,000 tasks within 200 ms', () => {
  const ms = measureMs(() => applyFilters(LARGE_DATASET, filters));
  expect(ms).toBeLessThan(200);
});
```

**Goals:**
- Detect algorithmic regressions (e.g., an O(n²) loop creeping in).
- Set generous thresholds (50–500 ms) to account for CI machine variance.
- Log actual timings with `console.log` for visibility.

---

### 4.8 Edge Case Tests

Edge case tests target rare but important inputs:

| Category | Examples |
|----------|---------|
| Empty inputs | `''`, `null`, `undefined`, `[]` |
| Boundary values | Exactly `TITLE_MIN_LENGTH`, exactly `TITLE_MAX_LENGTH` |
| Special characters | Unicode, emoji, SQL/XSS strings |
| Date extremes | Unix epoch, year 9999, leap year days |
| Single-element arrays | Sorting, grouping with one item |
| Idempotency | Same operation applied twice |

---

### 4.9 Mocking Tests

The mocking tests demonstrate Vitest's mocking capabilities as a reference
for developers writing new tests.

**Patterns demonstrated:**

| Pattern | API | Use case |
|---------|-----|---------|
| Spy function | `vi.fn()` | Verify a callback was called with correct args |
| Spy on existing | `vi.spyOn(obj, 'method')` | Intercept real module methods |
| Stub fetch | `vi.spyOn(globalThis, 'fetch')` | Simulate HTTP without a server |
| Freeze time | `vi.useFakeTimers()` + `vi.setSystemTime()` | Deterministic date/timer tests |
| Module mock | `vi.mock('@/lib/...')` | Replace entire module with a fake |
| Sequential returns | `.mockReturnValueOnce()` | Different return per call |
| Async mocks | `.mockResolvedValue()` / `.mockRejectedValue()` | Simulate async API |

---

### 4.10 Concurrent Tests

Concurrent tests verify **async patterns** used throughout the codebase:

- `Promise.all` — parallel operations with shared results
- `Promise.allSettled` — tolerant parallel collection (never throws)
- Sequential async chains via `reduce`
- Retry logic with backoff
- `Promise.race` — first-to-resolve wins
- Immutability under concurrent update pressure

---

## 5. Running the Tests

### Commands

```bash
# Run all tests once (CI mode)
npm test

# Watch mode — re-run on file changes (development)
npm run test:watch

# Open the interactive browser UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Filtering

```bash
# Run only the unit tests
npx vitest run tests/unit

# Run a specific file
npx vitest run tests/unit/taskUtils.test.ts

# Run tests matching a pattern
npx vitest run -t "filterTasksBySearch"

# Run tests in a specific folder
npx vitest run tests/advanced
```

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `VITEST_TIMEOUT` | 5000 | Test timeout in ms (override per-test with `{ timeout: N }`) |

---

## 6. Coverage

### Thresholds

Defined in `vitest.config.ts`:

| Metric | Minimum |
|--------|---------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

The build fails if any threshold is not met.

### Generating the Report

```bash
npm run test:coverage
# → coverage/index.html  (HTML report — open in browser)
# → coverage/coverage.json (machine-readable)
```

### Reading the Report

```
File            | % Stmts | % Branch | % Funcs | % Lines
----------------|---------|----------|---------|--------
lib/taskUtils   |   98.2  |   94.1   |   100   |  98.2
lib/dateUtils   |   95.0  |   88.2   |   100   |  95.0
lib/validation  |  100.0  |   96.7   |   100   | 100.0
components/     |   87.3  |   82.1   |   91.4  |  87.3
```

**Interpreting branch coverage:** A branch is every `if/else`, ternary, or
`&&/||` expression. 100% branch coverage means every possible code path has
been executed at least once.

---

## 7. Test Patterns & Recipes

### AAA Pattern (Arrange–Act–Assert)

Every test follows this structure:

```typescript
it('updates the task title', () => {
  // Arrange — set up the inputs
  const original = createTask({ title: 'Old' });

  // Act — perform the operation under test
  const updated = updateTask(original, { title: 'New' });

  // Assert — verify the outcome
  expect(updated.title).toBe('New');
});
```

### Parameterised Tests (`it.each`)

Use `it.each` to avoid copy-pasting the same test with different inputs:

```typescript
it.each(['low', 'medium', 'high', 'critical'])(
  'validatePriority passes for "%s"',
  (priority) => {
    expect(validatePriority(priority).valid).toBe(true);
  },
);
```

### Async Tests

```typescript
it('resolves with the created task', async () => {
  const task = await createTaskAPI({ title: 'Async task' });
  expect(task.id).toMatch(/^task_/);
});
```

### Testing Thrown Errors

```typescript
it('throws when given invalid input', () => {
  expect(() => riskyFunction(null)).toThrow('Input cannot be null');
});

// For async errors:
it('rejects with an error message', async () => {
  await expect(asyncFunction()).rejects.toThrow('Network error');
});
```

### Custom `render` Wrappers

When components require context providers, wrap them in a helper:

```typescript
function renderWithProviders(ui: React.ReactElement) {
  return render(<ThemeProvider>{ui}</ThemeProvider>);
}
```

---

## 8. Mocking Strategy

### When to Mock

| Dependency | Mock? | Reason |
|-----------|-------|--------|
| `localStorage` | Only when testing error paths | jsdom provides a real stub; reset it in `beforeEach` |
| `fetch` | Yes | Real HTTP calls are flaky and slow |
| `Date.now()` | Yes — via `vi.useFakeTimers()` | Overdue calculations must be deterministic |
| `Math.random()` | Yes — via `vi.spyOn()` | ID generation tests need stable output |
| Child components | Rarely | Prefer real components for integration value |
| Database | Yes | Use an in-memory store instead |

### Mock Lifecycle

```typescript
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2024-06-15'));
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks(); // undoes all spyOn calls
});
```

### The Difference Between `clear`, `reset`, and `restore`

| Method | Effect |
|--------|--------|
| `vi.clearAllMocks()` | Clears call history and return values, keeps implementation |
| `vi.resetAllMocks()` | Clears history + removes implementation (returns `undefined`) |
| `vi.restoreAllMocks()` | Restores `spyOn` targets to their original implementation |

---

## 9. Snapshot Testing

### Best Practices

1. **Use stable fixtures** — replace dynamic values (IDs, timestamps) with
   fixed strings so snapshots don't change on every run.

2. **Keep snapshots small** — snapshot a component, not an entire page.
   Large snapshots are hard to review in PRs.

3. **Review snapshot diffs in PRs** — snapshot changes should always be
   intentional and clearly explained in the PR description.

4. **Don't snapshot everything** — prefer explicit assertions for critical
   behaviour. Snapshots are best for detecting *accidental* markup changes.

### Snapshot File Location

Vitest stores snapshots in a `__snapshots__/` directory adjacent to the test
file. These files are committed to version control.

```
tests/advanced/__snapshots__/snapshots.test.tsx.snap
tests/components/__snapshots__/TaskCard.test.tsx.snap
```

---

## 10. Performance Testing

### Methodology

```typescript
function measureMs(fn: () => void): number {
  const start = performance.now();
  fn();
  return performance.now() - start;
}

it('sorts 10,000 tasks within 200 ms', () => {
  const ms = measureMs(() => sortTasks(LARGE_DATASET, 'priority', 'desc'));
  expect(ms).toBeLessThan(200);
});
```

### Threshold Guidelines

| Dataset Size | Acceptable Time |
|-------------|----------------|
| 100 items | < 10 ms |
| 1,000 items | < 50 ms |
| 10,000 items | < 500 ms |
| 100,000 items | Evaluate algorithm |

### Interpreting Results

Performance tests log actual timings to stdout. Check these logs when a test
is flaky near the threshold — it may indicate the threshold needs raising on
CI machines, or a genuine performance regression in the code.

---

## 11. Hook Testing

### `renderHook` + `act`

```typescript
import { renderHook, act } from '@testing-library/react';

it('adds a task', () => {
  const { result } = renderHook(() => useTasks(DEFAULT_FILTERS));

  act(() => {
    result.current.addTask({ title: 'New task' });
  });

  expect(result.current.tasks[0].title).toBe('New task');
});
```

### Key Rules

- **Always use `act()`** when calling functions that update state.
- **Re-read `result.current`** after each `act()` — it is a live reference that
  reflects the latest render.
- **Isolate localStorage** — clear it in `beforeEach` so hook state doesn't
  carry over between tests.

### Testing Debounced Hooks

```typescript
beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

it('debounces the query update', () => {
  const { result } = renderHook(() => useSearch('', 300));
  act(() => { result.current.setQuery('hello'); });
  // Not yet updated:
  expect(result.current.debouncedQuery).toBe('');
  // Advance past the debounce:
  act(() => { vi.advanceTimersByTime(300); });
  expect(result.current.debouncedQuery).toBe('hello');
});
```

---

## 12. API Route Testing

### Constructing `NextRequest`

```typescript
const req = new NextRequest('http://localhost/api/tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'Task' }),
});
```

### Module Isolation with `vi.resetModules()`

API routes use a module-level in-memory store. Reset it between tests:

```typescript
async function freshRouteModule() {
  vi.resetModules();
  return import('@/app/api/tasks/route');
}
```

### HTTP Status Code Assertions

```typescript
expect(res.status).toBe(200); // OK
expect(res.status).toBe(201); // Created
expect(res.status).toBe(400); // Bad Request
expect(res.status).toBe(404); // Not Found
expect(res.status).toBe(422); // Unprocessable Entity (validation error)
```

---

## 13. Integration Testing

### Scope

Integration tests in `tests/integration/` render the full `HomePage` component,
which internally uses `useTasks`, `useFilter`, `useSearch`, and all
presentational components. They verify that the pieces work together.

### localStorage Isolation

```typescript
beforeEach(() => {
  localStorage.clear(); // prevent seed tasks from polluting tests
});
```

### `waitFor` for Async State Updates

After user interactions that trigger state changes, wrap assertions in
`waitFor()`:

```typescript
await userEvent.click(screen.getByTestId('submit-button'));

await waitFor(() => {
  expect(screen.getByText('New task')).toBeInTheDocument();
});
```

### `within` for Scoped Queries

When multiple cards are rendered, scope queries to a specific card:

```typescript
import { within } from '@testing-library/react';

const cards = screen.getAllByTestId('task-card');
const firstCard = cards[0];
await userEvent.click(within(firstCard).getByTestId('delete-button'));
```

---

## 14. Advanced Topics

### Testing Custom Error Boundaries

```typescript
it('catches rendering errors', () => {
  const BrokenComponent = () => { throw new Error('render error'); };
  // Suppress React's error output during this test
  vi.spyOn(console, 'error').mockImplementation(() => {});
  expect(() => render(<ErrorBoundary><BrokenComponent /></ErrorBoundary>))
    .not.toThrow();
});
```

### Property-Based Testing (Future)

For more thorough validation testing, consider integrating
[fast-check](https://github.com/dubzzz/fast-check) to generate hundreds of
random inputs automatically:

```typescript
import fc from 'fast-check';

it('never crashes on arbitrary string input', () => {
  fc.assert(fc.property(fc.string(), (s) => {
    expect(() => filterTasksBySearch(tasks, s)).not.toThrow();
  }));
});
```

### Testing with Multiple Renders (`rerender`)

```typescript
const { rerender } = render(<TaskCard task={TASK_A} ... />);
expect(screen.getByText('Task A')).toBeInTheDocument();

rerender(<TaskCard task={TASK_B} ... />);
expect(screen.getByText('Task B')).toBeInTheDocument();
```

### Asserting Component Unmount

```typescript
const { unmount } = render(<MyComponent />);
unmount();
// Verify cleanup occurred (e.g., no memory leaks, event listeners removed)
```

---

## 15. CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Run tests with coverage
        run: npm run test:coverage

      - name: Upload coverage report
        uses: actions/upload-artifact@v4
        with:
          name: coverage-report
          path: coverage/
```

### Coverage Reporting Services

To integrate with [Codecov](https://codecov.io/) or [Coveralls](https://coveralls.io/):

```yaml
- name: Upload to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/coverage.json
```

---

## 16. Common Pitfalls

### 1. Forgetting `act()` around state updates

```typescript
// ❌ Wrong — state update not wrapped
result.current.addTask({ title: 'Task' });

// ✅ Correct
act(() => { result.current.addTask({ title: 'Task' }); });
```

### 2. Using `getBy` instead of `queryBy` for absent elements

```typescript
// ❌ getBy throws if element is absent
expect(screen.getByTestId('error-msg')).not.toBeInTheDocument();

// ✅ queryBy returns null without throwing
expect(screen.queryByTestId('error-msg')).not.toBeInTheDocument();
```

### 3. Not cleaning up timers

```typescript
// ❌ Fake timers bleed into other tests
beforeEach(() => vi.useFakeTimers());
// Missing afterEach!

// ✅ Always restore
afterEach(() => vi.useRealTimers());
```

### 4. Asserting on text that includes hidden elements

Some DOM elements (like emoji `aria-hidden` spans) can affect `textContent`.
Use `toHaveTextContent` with a string match instead of strict equality.

```typescript
// ✅ Partial match works
expect(card).toHaveTextContent('High');
```

### 5. Snapshot tests with dynamic values

```typescript
// ❌ ID changes every test run → snapshot always fails
const task = createTask({ title: 'Test' }); // generates a new ID each time

// ✅ Use a stable fixture
const task: Task = { id: 'stable_id_001', ... };
```

### 6. Testing implementation details

```typescript
// ❌ Tests internal state variable name
expect(component.state.isLoading).toBe(false);

// ✅ Tests observable behaviour
expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
```

---

## 17. Glossary

| Term | Definition |
|------|-----------|
| **AAA** | Arrange, Act, Assert — the standard test structure pattern |
| **act()** | React testing utility that ensures state updates are flushed before assertions |
| **Boundary value** | A value exactly at the edge of a valid/invalid range (e.g., `TITLE_MIN_LENGTH`) |
| **Coverage** | The percentage of source lines/branches exercised by the test suite |
| **Equivalence class** | A group of inputs that are expected to behave identically |
| **Fixture** | Pre-built test data used across multiple tests |
| **Integration test** | A test that verifies multiple components working together |
| **jsdom** | A Node.js implementation of the browser DOM, used by Vitest as the test environment |
| **Mock** | A fake implementation of a dependency that records how it was called |
| **renderHook** | Testing Library utility for testing custom React hooks in isolation |
| **Snapshot** | A serialised representation of a component's DOM, used for regression detection |
| **Spy** | A wrapper around a real function that records its calls without changing behaviour |
| **Stub** | A fake implementation that returns hard-coded values (simpler than a full mock) |
| **vi.fn()** | Vitest's mock function factory |
| **waitFor** | Testing Library utility that retries an assertion until it passes (for async UI updates) |

---

*Generated for the TaskFlow project — Next.js 14 + Vitest*
