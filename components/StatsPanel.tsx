import { TaskStats } from '@/types';

interface StatsPanelProps {
  stats: TaskStats;
}

/**
 * StatsPanel
 * ----------
 * Displays aggregate task statistics: totals by status, overdue count,
 * and the overall completion rate as a progress bar.
 */
export default function StatsPanel({ stats }: StatsPanelProps) {
  return (
    <section
      aria-label="Task statistics"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
      data-testid="stats-panel"
    >
      <StatCard
        label="Total"
        value={stats.total}
        emoji="📋"
        colorClass="bg-blue-50 text-blue-700"
        testId="stat-total"
      />
      <StatCard
        label="In Progress"
        value={stats.byStatus['in-progress']}
        emoji="⚡"
        colorClass="bg-yellow-50 text-yellow-700"
        testId="stat-in-progress"
      />
      <StatCard
        label="Done"
        value={stats.byStatus.done}
        emoji="✅"
        colorClass="bg-green-50 text-green-700"
        testId="stat-done"
      />
      <StatCard
        label="Overdue"
        value={stats.overdue}
        emoji="⚠️"
        colorClass={stats.overdue > 0 ? 'bg-red-50 text-red-700' : 'bg-gray-50 text-gray-500'}
        testId="stat-overdue"
      />

      {/* Completion progress bar — spans full width on large screens */}
      <div
        className="col-span-2 sm:col-span-4 rounded-xl bg-white border p-4 shadow-sm"
        data-testid="completion-rate"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Overall completion</span>
          <span className="text-sm font-bold text-gray-800">{stats.completionRate}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-gray-200" role="progressbar"
          aria-valuenow={stats.completionRate}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-2 rounded-full bg-green-500 transition-all duration-500"
            style={{ width: `${stats.completionRate}%` }}
          />
        </div>
      </div>
    </section>
  );
}

// ── Sub-component ─────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  emoji: string;
  colorClass: string;
  testId: string;
}

function StatCard({ label, value, emoji, colorClass, testId }: StatCardProps) {
  return (
    <div
      className={`rounded-xl border p-4 shadow-sm ${colorClass}`}
      data-testid={testId}
    >
      <div className="text-2xl font-bold">{value}</div>
      <div className="text-xs mt-1 font-medium opacity-80">
        <span aria-hidden>{emoji} </span>
        {label}
      </div>
    </div>
  );
}
