import { NextRequest, NextResponse } from 'next/server';
import { Task, ApiResponse, CreateTaskPayload } from '@/types';
import { createTask, updateTask } from '@/lib/taskUtils';
import { validateTask } from '@/lib/validation';

/**
 * In-memory task store for the API layer.
 * In a real app this would be replaced with a database call.
 * Exported so tests can reset or inspect it directly.
 */
export let taskStore: Task[] = [];

// ── GET /api/tasks ────────────────────────────────────────────────────────────

/** Returns the full task list as JSON. */
export async function GET(): Promise<NextResponse<ApiResponse<Task[]>>> {
  return NextResponse.json({ data: taskStore });
}

// ── POST /api/tasks ───────────────────────────────────────────────────────────

/** Creates a new task from the request body and appends it to the store. */
export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse<Task>>> {
  let body: Partial<CreateTaskPayload>;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  const validation = validateTask(body);
  if (!validation.valid) {
    return NextResponse.json(
      { error: validation.errors.join(' ') },
      { status: 422 },
    );
  }

  const newTask = createTask(body as CreateTaskPayload);
  taskStore = [newTask, ...taskStore];

  return NextResponse.json({ data: newTask, message: 'Task created.' }, { status: 201 });
}
