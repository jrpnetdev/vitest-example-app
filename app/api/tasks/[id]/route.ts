import { NextRequest, NextResponse } from 'next/server';
import { Task, ApiResponse, UpdateTaskPayload } from '@/types';
import { updateTask } from '@/lib/taskUtils';
import { taskStore } from '../route';

// Note: the taskStore is imported by reference so mutations propagate
// across both route files during a single server process.

/** Resolves and mutates the shared task store. Exported for test access. */
function getStore(): Task[] {
  // Re-import to get the live reference (Next.js module caching ensures
  // both route files share the same taskStore array reference).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('../route').taskStore as Task[];
}

function setStore(tasks: Task[]) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('../route').taskStore = tasks;
}

// ── PATCH /api/tasks/:id ──────────────────────────────────────────────────────

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<Task>>> {
  const store = getStore();
  const existing = store.find((t) => t.id === params.id);
  if (!existing) {
    return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
  }

  let body: Partial<UpdateTaskPayload>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const updated = updateTask(existing, body);
  setStore(store.map((t) => (t.id === params.id ? updated : t)));

  return NextResponse.json({ data: updated });
}

// ── DELETE /api/tasks/:id ─────────────────────────────────────────────────────

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse<ApiResponse<null>>> {
  const store = getStore();
  const exists = store.some((t) => t.id === params.id);
  if (!exists) {
    return NextResponse.json({ error: 'Task not found.' }, { status: 404 });
  }

  setStore(store.filter((t) => t.id !== params.id));
  return NextResponse.json({ message: 'Task deleted.' });
}
