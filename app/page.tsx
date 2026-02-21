'use client';

import { useState } from 'react';
import { Task, CreateTaskPayload } from '@/types';
import { useTasks } from '@/hooks/useTasks';
import { useFilter } from '@/hooks/useFilter';
import SearchBar from '@/components/SearchBar';
import TaskFilter from '@/components/TaskFilter';
import TaskList from '@/components/TaskList';
import TaskForm from '@/components/TaskForm';
import StatsPanel from '@/components/StatsPanel';

/**
 * Home page — the main task management view.
 *
 * Composes hooks and presentational components into the full application UI:
 *   - Stats dashboard at the top.
 *   - Search + filter bar.
 *   - The filtered task list.
 *   - A slide-in form panel for creating / editing tasks.
 */
export default function HomePage() {
  const { filters, setSearch, setPriority, setCategory, setStatus, setSortBy, setSortOrder, resetFilters, isFiltered } = useFilter();
  const { filteredTasks, stats, addTask, editTask, removeTask, duplicateTaskById, toggleStatus } = useTasks(filters);

  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | undefined>(undefined);

  function handleAddTask(payload: CreateTaskPayload) {
    addTask(payload);
    setShowForm(false);
  }

  function handleEditTask(payload: CreateTaskPayload) {
    if (editingTask) {
      editTask(editingTask.id, payload);
      setEditingTask(undefined);
      setShowForm(false);
    }
  }

  function handleOpenEdit(task: Task) {
    setEditingTask(task);
    setShowForm(true);
  }

  function handleCancelForm() {
    setShowForm(false);
    setEditingTask(undefined);
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <StatsPanel stats={stats} />

      {/* Controls */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 max-w-xs">
          <SearchBar value={filters.search} onChange={setSearch} />
        </div>
        <button
          type="button"
          onClick={() => { setEditingTask(undefined); setShowForm(true); }}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm"
          data-testid="add-task-button"
        >
          + New Task
        </button>
      </div>

      {/* Filters */}
      <TaskFilter
        filters={filters}
        onPriorityChange={setPriority}
        onCategoryChange={setCategory}
        onStatusChange={setStatus}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
        onReset={resetFilters}
        isFiltered={isFiltered}
      />

      {/* Form (inline panel) */}
      {showForm && (
        <div className="rounded-xl border bg-white p-6 shadow-md" data-testid="task-form-panel">
          <TaskForm
            task={editingTask}
            onSubmit={editingTask ? handleEditTask : handleAddTask}
            onCancel={handleCancelForm}
          />
        </div>
      )}

      {/* Task list */}
      <TaskList
        tasks={filteredTasks}
        onToggleStatus={toggleStatus}
        onEdit={handleOpenEdit}
        onDelete={removeTask}
        onDuplicate={(id) => duplicateTaskById(id)}
      />
    </div>
  );
}
