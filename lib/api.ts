import { Task, CreateTaskPayload, UpdateTaskPayload, ApiResponse } from '@/types';

/**
 * api.ts
 * ------
 * Thin client-side wrappers around the /api/tasks REST endpoints.
 * All functions throw on non-2xx responses, making error handling
 * consistent for callers (use try/catch or .catch()).
 */

const BASE = '/api/tasks';

/** Shared fetch helper — throws on non-OK responses with the server error message. */
async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  });
  const json: ApiResponse<T> = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? `Request failed with status ${res.status}`);
  }
  return json.data as T;
}

/** GET /api/tasks — Returns the full task list. */
export async function fetchTasks(): Promise<Task[]> {
  return request<Task[]>(BASE);
}

/** POST /api/tasks — Creates a new task and returns the persisted entity. */
export async function createTaskAPI(payload: CreateTaskPayload): Promise<Task> {
  return request<Task>(BASE, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** PATCH /api/tasks/:id — Partially updates a task. */
export async function updateTaskAPI(id: string, updates: UpdateTaskPayload): Promise<Task> {
  return request<Task>(`${BASE}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

/** DELETE /api/tasks/:id — Deletes a task, returning no body. */
export async function deleteTaskAPI(id: string): Promise<void> {
  await request<void>(`${BASE}/${id}`, { method: 'DELETE' });
}
