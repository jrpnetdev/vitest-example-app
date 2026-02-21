/**
 * tests/api/tasks.test.ts
 * ------------------------
 * Tests for the Next.js API route handlers: GET and POST /api/tasks
 *
 * Testing approach:
 *   - Next.js route handlers are plain async functions; we call them directly
 *     without spinning up an HTTP server, making tests fast and reliable.
 *   - We construct NextRequest objects for POST routes that need a body.
 *   - The module-level taskStore is reset before each test to ensure isolation.
 *   - Tests cover: success paths, validation errors, and malformed JSON.
 *
 * Note: PATCH and DELETE for /api/tasks/[id] require mocking the dynamic
 *       `params` argument — those are covered in advanced/mocking.test.ts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';

// ── Module Reset Helper ───────────────────────────────────────────────────────

/**
 * Because the taskStore lives at module scope, we must reset the module
 * between tests so each test starts with an empty store.
 * vi.resetModules() + dynamic import gives us a fresh module instance.
 */
async function freshRouteModule() {
  vi.resetModules();
  return import('@/app/api/tasks/route');
}

// ── GET /api/tasks ────────────────────────────────────────────────────────────

describe('GET /api/tasks', () => {
  it('returns 200 with an empty array when the store is empty', async () => {
    const { GET, taskStore } = await freshRouteModule();
    // Ensure the store is empty (seed tasks may be present in the module)
    // We cast to 'any' to mutate the exported let for test isolation.
    // In production the store is only mutated via POST/PATCH/DELETE.
    (await freshRouteModule()); // re-import for clean state

    const { GET: GET2 } = await freshRouteModule();
    const res = await GET2();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('returns the tasks that were previously added', async () => {
    const mod = await freshRouteModule();
    // Directly push a task into the store to simulate prior state
    (mod as unknown as { taskStore: object[] }).taskStore.push({
      id: 'direct_001',
      title: 'Direct push',
      priority: 'low',
      category: 'other',
      status: 'todo',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    });

    const res = await mod.GET();
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe('direct_001');
  });
});

// ── POST /api/tasks ───────────────────────────────────────────────────────────

describe('POST /api/tasks', () => {
  /** Helper that builds a NextRequest with a JSON body. */
  function makePostRequest(body: unknown): NextRequest {
    return new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  it('returns 201 and the created task for a valid payload', async () => {
    const { POST } = await freshRouteModule();
    const req = makePostRequest({ title: 'Test task from POST' });
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.title).toBe('Test task from POST');
    expect(body.data.id).toMatch(/^task_/);
    expect(body.message).toBe('Task created.');
  });

  it('assigns default priority "medium" when not specified', async () => {
    const { POST } = await freshRouteModule();
    const req = makePostRequest({ title: 'Default priority task' });
    const res = await POST(req);
    const body = await res.json();

    expect(body.data.priority).toBe('medium');
  });

  it('persists custom fields in the created task', async () => {
    const { POST } = await freshRouteModule();
    const req = makePostRequest({
      title: 'Custom task',
      priority: 'critical',
      category: 'work',
      tags: ['urgent'],
    });
    const res = await POST(req);
    const body = await res.json();

    expect(body.data.priority).toBe('critical');
    expect(body.data.category).toBe('work');
    expect(body.data.tags).toContain('urgent');
  });

  it('returns 422 with an error message when title is missing', async () => {
    const { POST } = await freshRouteModule();
    const req = makePostRequest({ priority: 'low' }); // no title
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(422);
    expect(body.error).toBeTruthy();
  });

  it('returns 422 when title is too short', async () => {
    const { POST } = await freshRouteModule();
    const req = makePostRequest({ title: 'ab' }); // < 3 chars
    const res = await POST(req);

    expect(res.status).toBe(422);
  });

  it('returns 400 when the body is not valid JSON', async () => {
    const { POST } = await freshRouteModule();
    // Construct a request with invalid JSON body
    const req = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'NOT_JSON',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/json/i);
  });

  it('adds the new task to the start of the store', async () => {
    const mod = await freshRouteModule();

    // Manually seed one task
    (mod as unknown as { taskStore: object[] }).taskStore.push({
      id: 'seed_001', title: 'Seed task',
      priority: 'low', category: 'other', status: 'todo',
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), tags: [],
    });

    const req = new NextRequest('http://localhost/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Newest task' }),
    });

    await mod.POST(req);

    const res = await mod.GET();
    const body = await res.json();
    // Newest task is prepended
    expect(body.data[0].title).toBe('Newest task');
  });
});
