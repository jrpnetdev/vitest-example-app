'use client';

import { useState, useEffect } from 'react';
import { Task, CreateTaskPayload, Priority, Category } from '@/types';
import { validateTask } from '@/lib/validation';
import { toInputDateFormat } from '@/lib/dateUtils';

interface TaskFormProps {
  /** When provided the form operates in edit mode, pre-populating fields. */
  task?: Task;
  onSubmit: (data: CreateTaskPayload) => void;
  onCancel: () => void;
}

const PRIORITIES: Priority[] = ['low', 'medium', 'high', 'critical'];
const CATEGORIES: Category[] = ['work', 'personal', 'shopping', 'health', 'other'];

/**
 * TaskForm
 * --------
 * A controlled form for creating or editing a task.
 * Performs client-side validation before calling onSubmit.
 */
export default function TaskForm({ task, onSubmit, onCancel }: TaskFormProps) {
  const isEditing = !!task;

  // ── Form State ──────────────────────────────────────────────────────────────
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [priority, setPriority] = useState<Priority>(task?.priority ?? 'medium');
  const [category, setCategory] = useState<Category>(task?.category ?? 'other');
  const [dueDate, setDueDate] = useState(toInputDateFormat(task?.dueDate));
  const [tagsInput, setTagsInput] = useState(task?.tags.join(', ') ?? '');
  const [assignee, setAssignee] = useState(task?.assignee ?? '');
  const [errors, setErrors] = useState<string[]>([]);

  // Re-populate when the task prop changes (e.g. user selects a different task to edit)
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description ?? '');
      setPriority(task.priority);
      setCategory(task.category);
      setDueDate(toInputDateFormat(task.dueDate));
      setTagsInput(task.tags.join(', '));
      setAssignee(task.assignee ?? '');
    }
  }, [task]);

  // ── Submission ──────────────────────────────────────────────────────────────
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const payload: CreateTaskPayload = {
      title,
      description: description || undefined,
      priority,
      category,
      dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      tags,
      assignee: assignee || undefined,
    };

    const result = validateTask(payload);
    if (!result.valid) {
      setErrors(result.errors);
      return;
    }

    setErrors([]);
    onSubmit(payload);
  }

  const inputClass =
    'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100';
  const labelClass = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-4" data-testid="task-form">
      <h2 className="text-lg font-semibold text-gray-800">
        {isEditing ? 'Edit Task' : 'New Task'}
      </h2>

      {/* Validation errors */}
      {errors.length > 0 && (
        <ul
          role="alert"
          className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-600 space-y-1"
          data-testid="form-errors"
        >
          {errors.map((err) => (
            <li key={err}>• {err}</li>
          ))}
        </ul>
      )}

      {/* Title */}
      <div>
        <label htmlFor="task-title" className={labelClass}>
          Title <span aria-hidden>*</span>
        </label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          required
          className={inputClass}
          data-testid="title-input"
        />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="task-description" className={labelClass}>
          Description
        </label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more detail…"
          rows={3}
          className={inputClass}
          data-testid="description-input"
        />
      </div>

      {/* Priority + Category */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="task-priority" className={labelClass}>
            Priority
          </label>
          <select
            id="task-priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className={inputClass}
            data-testid="priority-select"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="task-category" className={labelClass}>
            Category
          </label>
          <select
            id="task-category"
            value={category}
            onChange={(e) => setCategory(e.target.value as Category)}
            className={inputClass}
            data-testid="category-select"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.charAt(0).toUpperCase() + c.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Due Date + Assignee */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="task-due-date" className={labelClass}>
            Due Date
          </label>
          <input
            id="task-due-date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputClass}
            data-testid="due-date-input"
          />
        </div>

        <div>
          <label htmlFor="task-assignee" className={labelClass}>
            Assignee
          </label>
          <input
            id="task-assignee"
            type="text"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            placeholder="Name or email"
            className={inputClass}
            data-testid="assignee-input"
          />
        </div>
      </div>

      {/* Tags */}
      <div>
        <label htmlFor="task-tags" className={labelClass}>
          Tags (comma-separated)
        </label>
        <input
          id="task-tags"
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder="e.g. frontend, urgent, v2"
          className={inputClass}
          data-testid="tags-input"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50"
          data-testid="cancel-button"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          data-testid="submit-button"
        >
          {isEditing ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  );
}
