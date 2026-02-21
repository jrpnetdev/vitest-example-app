# TaskFlow

> A task management web application built with **Next.js 14** and tested
> comprehensively with **Vitest** — demonstrating a wide range of testing
> techniques from standard unit tests through to advanced mocking,
> performance benchmarking, and concurrent async patterns.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Scripts](#scripts)
- [The Application](#the-application)
- [Testing](#testing)
  - [Test Suite at a Glance](#test-suite-at-a-glance)
  - [Test Categories](#test-categories)
  - [Running Tests](#running-tests)
  - [Coverage](#coverage)
- [Architecture Decisions](#architecture-decisions)
- [Further Reading](#further-reading)

---

## Overview

TaskFlow is a fully functional task manager where users can:

- Create, edit, duplicate, and delete tasks
- Set priority levels (Low / Medium / High / Critical)
- Assign tasks to categories (Work, Personal, Shopping, Health, Other)
- Track lifecycle status (To Do → In Progress → Done)
- Set optional due dates and assignees
- Tag tasks with free-text labels
- Search tasks by title, description, or tag
- Filter by priority, category, and status simultaneously
- Sort by creation date, due date, priority, or title
- View live aggregate statistics and a completion-rate progress bar

State is persisted to `localStorage` so data survives page refreshes without
requiring a backend database.

The primary purpose of this project is to serve as a **testing reference** — a
real-world codebase with meaningful business logic that can be exercised by
every category of test that Vitest supports.

---

## Tech Stack

### Application

| Package | Version | Role |
|---------|---------|------|
| [Next.js](https://nextjs.org/) | 14.1.0 | React framework — App Router, API routes |
| [React](https://react.dev/) | ^18 | UI library |
| [TypeScript](https://www.typescriptlang.org/) | ^5 | Type safety throughout |
| [Tailwind CSS](https://tailwindcss.com/) | ^3.3 | Utility-first styling |
| [clsx](https://github.com/lukeed/clsx) | ^2.1 | Conditional class name helper |

### Testing

| Package | Version | Role |
|---------|---------|------|
| [Vitest](https://vitest.dev/) | ^1.3 | Test runner, assertion library, mocking |
| [@testing-library/react](https://testing-library.com/docs/react-testing-library/intro/) | ^14.2 | Component rendering and DOM queries |
| [@testing-library/user-event](https://testing-library.com/docs/user-event/intro/) | ^14.5 | Realistic browser-like interaction simulation |
| [@testing-library/jest-dom](https://github.com/testing-library/jest-dom) | ^6.4 | Extended DOM matchers |
| [jsdom](https://github.com/jsdom/jsdom) | ^24 | Browser environment emulation in Node |
| [@vitest/coverage-v8](https://vitest.dev/guide/coverage) | ^1.3 | V8-based code coverage reporting |
| [@vitest/ui](https://vitest.dev/guide/ui) | ^1.3 | Interactive browser test dashboard |

---

## Project Structure

```
taskflow/
│
├── app/                            # Next.js App Router
│   ├── layout.tsx                  # Root HTML shell
│   ├── page.tsx                    # Main task manager page (client component)
│   ├── globals.css                 # Tailwind base styles
│   └── api/
│       └── tasks/
│           ├── route.ts            # GET /api/tasks, POST /api/tasks
│           └── [id]/
│               └── route.ts       # PATCH /api/tasks/:id, DELETE /api/tasks/:id
│
├── components/                     # Presentational React components
│   ├── TaskCard.tsx                # Individual task — display + actions
│   ├── TaskForm.tsx                # Create / edit form with validation
│   ├── TaskList.tsx                # List wrapper + empty state
│   ├── TaskFilter.tsx              # Priority / category / status selects
│   ├── SearchBar.tsx               # Controlled search input with clear button
│   ├── PriorityIndicator.tsx       # Coloured badge or dot for priority level
│   ├── CategoryBadge.tsx           # Emoji + colour badge for category
│   └── StatsPanel.tsx              # Stat cards + completion progress bar
│
├── hooks/                          # Custom React hooks
│   ├── useTasks.ts                 # Central CRUD state + localStorage
│   ├── useFilter.ts                # Filter/sort state with granular setters
│   ├── useSearch.ts                # Debounced search query
│   └── useLocalStorage.ts          # Generic localStorage ↔ React state sync
│
├── lib/                            # Pure utility modules
│   ├── taskUtils.ts                # createTask, updateTask, calculateStats, …
│   ├── dateUtils.ts                # formatDate, formatRelativeDate, addDays, …
│   ├── validation.ts               # validateTitle, validateTask, validateEmail, …
│   ├── sorting.ts                  # sortTasks, multiSort, comparators
│   ├── filtering.ts                # filterByPriority, applyFilters pipeline
│   └── api.ts                      # fetch wrappers for the REST endpoints
│
├── types/
│   └── index.ts                    # Task, Priority, Category, Status, … domain types
│
├── tests/                          # ← All Vitest test files
│   ├── setup.ts                    # Global setup: jest-dom, localStorage reset
│   ├── unit/                       # Pure function tests (5 files)
│   ├── components/                 # Component render + interaction tests (5 files)
│   ├── hooks/                      # Hook lifecycle tests (4 files)
│   ├── api/                        # Next.js route handler tests (1 file)
│   ├── integration/                # Full page workflow tests (1 file)
│   └── advanced/                   # Performance, edge cases, mocking, … (5 files)
│
├── testing/
│   └── testing.md                  # In-depth testing guide (700+ lines)
│
├── vitest.config.ts                # Vitest configuration
├── next.config.js                  # Next.js configuration
├── tailwind.config.ts              # Tailwind configuration
├── tsconfig.json                   # TypeScript configuration
└── package.json
```

---

## Getting Started

### Prerequisites

- **Node.js** 18 or later
- **npm** 9 or later (or pnpm / yarn)

### Installation

```bash
# Clone or open the project folder
cd taskflow

# Install all dependencies
npm install
```

### Run the development server

```bash
npm run dev
# → http://localhost:3000
```

### Run the test suite

```bash
npm test
```

---

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `next dev` | Start the Next.js development server |
| `build` | `next build` | Production build |
| `start` | `next start` | Serve the production build |
| `lint` | `next lint` | Run ESLint |
| `test` | `vitest run` | Run all tests once (CI mode) |
| `test:watch` | `vitest` | Watch mode — re-run on file changes |
| `test:ui` | `vitest --ui` | Open the interactive browser test dashboard |
| `test:coverage` | `vitest run --coverage` | Run tests and generate a coverage report |

---

## The Application

### Data Model

```typescript
interface Task {
  id: string;           // "task_<timestamp>_<random>"
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'work' | 'personal' | 'shopping' | 'health' | 'other';
  status: 'todo' | 'in-progress' | 'done';
  dueDate?: string;     // ISO 8601
  createdAt: string;    // ISO 8601 — immutable
  updatedAt: string;    // ISO 8601 — updated on every change
  tags: string[];
  assignee?: string;
}
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/tasks` | Return all tasks |
| `POST` | `/api/tasks` | Create a new task (validates payload) |
| `PATCH` | `/api/tasks/:id` | Partially update a task |
| `DELETE` | `/api/tasks/:id` | Delete a task |

All endpoints return `{ data?, error?, message? }` envelopes.
Validation errors return HTTP `422`; missing resources return `404`.

### State Management

There is no external state library. State flows as follows:

```
localStorage  ←→  useLocalStorage  ←→  useTasks  →  filteredTasks (memo)
                                                  →  stats (memo)
useFilter     →  TaskFilter / SearchBar
```

`useTasks` consumes the active `TaskFilters` from `useFilter` and derives
`filteredTasks` with `useMemo`, so the filtered list re-computes only when
the task array or filters actually change.

---

## Testing

### Test Suite at a Glance

| Category | Files | Tests (approx.) | Focus |
|----------|-------|-----------------|-------|
| Unit | 5 | ~120 | Pure functions in `lib/` |
| Component | 5 | ~70 | React component rendering & interaction |
| Hooks | 4 | ~50 | Custom hook lifecycle & state |
| API | 1 | ~12 | Next.js route handler functions |
| Integration | 1 | ~15 | End-to-end user workflows on the full page |
| Advanced | 5 | ~70 | Performance, edge cases, mocking, concurrency, snapshots |
| **Total** | **21** | **~337** | |

---

### Test Categories

#### Unit Tests — `tests/unit/`

Test each pure utility function in complete isolation.
No DOM, no React, no network — just input → output.

```
taskUtils.test.ts    createTask, updateTask, calculateStats, toggleStatus, …
dateUtils.test.ts    formatDate, formatRelativeDate, getDaysBetween, addDays, …
validation.test.ts   validateTitle, validateTask, validateEmail, boundary values
sorting.test.ts      sortTasks, multiSort, all four comparators
filtering.test.ts    filterByPriority, applyFilters pipeline composition
```

**Techniques:** equivalence partitioning, boundary value analysis, frozen
system time (`vi.useFakeTimers`), immutability checks.

---

#### Component Tests — `tests/components/`

Render each component into jsdom and verify its public interface —
what it displays and what events it emits.

```
TaskCard.test.tsx    Rendering, done/overdue states, click handlers, a11y, snapshot
TaskForm.test.tsx    Create mode, edit mode, validation errors, cancel
TaskList.test.tsx    Empty state, task count, handler propagation, aria-label
SearchBar.test.tsx   Controlled value, clear button, aria roles
StatsPanel.test.tsx  Stat card values, progress bar aria, edge cases (0%, 100%)
```

**Techniques:** `render()`, `screen.*` queries, `userEvent`, `vi.fn()` callback
spies, role/label-based accessibility assertions.

---

#### Hook Tests — `tests/hooks/`

Use `renderHook()` and `act()` to drive hooks through their lifecycle.

```
useLocalStorage.test.ts   Read/write, updater fn, remove, corrupt JSON, quota error
useFilter.test.ts         Each setter, isFiltered derived value, resetFilters
useTasks.test.ts          addTask, editTask, removeTask, duplicateTaskById, toggleStatus
useSearch.test.ts         Immediate query, debounced query, clearSearch, custom delay
```

**Techniques:** `renderHook`, `act`, `vi.useFakeTimers` + `vi.advanceTimersByTime`
for debounce testing, `vi.spyOn(Storage.prototype, 'setItem')` for quota errors.

---

#### API Tests — `tests/api/`

Call Next.js route handler functions directly — no HTTP server required.

```
tasks.test.ts   GET (empty store, populated store)
                POST (valid payload, missing title, short title, invalid JSON)
```

**Techniques:** `new NextRequest(url, { body: JSON.stringify(...) })`,
`vi.resetModules()` + dynamic `import()` for per-test module isolation.

---

#### Integration Tests — `tests/integration/`

Render the full `HomePage` and drive it with `userEvent` across multi-step
workflows.

```
taskWorkflow.test.tsx   Task creation → appears in list
                        Status toggle → badge updates
                        Task deletion → removed from list
                        Edit button → form pre-populated
                        Search filtering → list filtered / restored
                        Stats panel increments on add
```

**Techniques:** `render(<HomePage />)`, `waitFor`, `within` for card-scoped
queries, `localStorage.clear()` isolation between tests.

---

#### Advanced Tests — `tests/advanced/`

```
performance.test.ts   applyFilters / sortTasks / calculateStats on 10,000 tasks
                      Timing thresholds via performance.now()
                      Sort stability verification

edgeCases.test.ts     Empty / null / undefined inputs
                      10,000-character strings
                      Unicode, emoji, SQL/XSS strings
                      Leap year, Unix epoch, year 9999
                      Array boundaries (0, 1 element)
                      Idempotency (toggle ×3 = original)

mocking.test.ts       vi.fn() — spies, return values, implementations
                      vi.spyOn() — Math.random, console.log
                      Mocking global fetch (success, error, 422)
                      vi.useFakeTimers — setSystemTime, advanceTimersByTime
                      localStorage.setItem mock (quota exceeded)
                      Async mock patterns (mockResolvedValue, mockRejectedValue)
                      vi.clearAllMocks / resetAllMocks / restoreAllMocks

concurrent.test.ts    Promise.all — parallel saves
                      Promise.allSettled — tolerant collection
                      Sequential async chains
                      Retry logic with backoff
                      Promise.race — first to resolve wins
                      Immutability under concurrent update pressure
                      try/catch/finally in async functions

snapshots.test.tsx    PriorityIndicator (all 4 levels + compact)
                      CategoryBadge (all 5 categories)
                      SearchBar (empty + populated)
                      TaskCard (normal, done, minimal)
                      StatsPanel (standard + zero stats)
                      TaskList (empty state + 2 tasks)
```

---

### Running Tests

```bash
# All tests, single run
npm test

# Watch mode (re-runs affected tests on save)
npm run test:watch

# Browser UI — filter, inspect, re-run individual tests
npm run test:ui

# With coverage report
npm run test:coverage
```

#### Filtering from the command line

```bash
# One file
npx vitest run tests/unit/taskUtils.test.ts

# One folder
npx vitest run tests/advanced

# By test name pattern
npx vitest run -t "calculateStats"

# Update all snapshots
npx vitest run --update-snapshots
```

---

### Coverage

Coverage is measured using [V8's built-in instrumentation](https://nodejs.org/api/coverage.html) via `@vitest/coverage-v8`.

#### Thresholds (configured in `vitest.config.ts`)

| Metric | Minimum |
|--------|---------|
| Statements | 80% |
| Branches | 75% |
| Functions | 80% |
| Lines | 80% |

The test run **fails** if any threshold is not met.

#### Viewing the report

```bash
npm run test:coverage
# → coverage/index.html   open in any browser
# → coverage/coverage.json  machine-readable, for CI upload
```

---

## Architecture Decisions

### Why an in-memory API store?

The API routes (`/api/tasks`) use a module-level JavaScript array as the data
store. This keeps the project self-contained (no database setup required) and
makes the API routes trivially testable by calling them as plain async functions
without spinning up an HTTP server.

In a production application this would be replaced with a database call
(e.g., Prisma + PostgreSQL).

### Why no global state library (Redux / Zustand)?

The task list state is small enough to be managed entirely with `useState`
inside a custom hook (`useTasks`), persisted via `useLocalStorage`. This keeps
the dependency graph flat and makes every layer independently testable without
provider boilerplate in tests.

### Why `data-testid` attributes?

Test IDs are used sparingly — only on elements that have no accessible role,
label, or text that can serve as a stable query target. Semantic queries
(`getByRole`, `getByLabelText`) are always preferred in line with the
[Testing Library guiding principles](https://testing-library.com/docs/guiding-principles/).

### Why Vitest over Jest?

- Native ESM and TypeScript — no Babel configuration required.
- Vite-powered bundling — the same fast toolchain as the dev server.
- Compatible `describe/it/expect` API — zero learning curve for Jest users.
- Parallel test execution by default.
- Superior watch mode — only re-runs tests affected by changed modules.

---

## Further Reading

- [testing/testing.md](testing/testing.md) — The full in-depth testing guide
  (philosophy, patterns, recipes, CI/CD setup, common pitfalls, glossary)
- [vitest.config.ts](vitest.config.ts) — Test environment and coverage
  configuration
- [tests/setup.ts](tests/setup.ts) — Global test setup

### External Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Docs](https://testing-library.com/docs/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Kent C. Dodds — Testing JavaScript](https://testingjavascript.com/)

---

*TaskFlow — Next.js 14 + Vitest · Built as a testing methodology reference*
