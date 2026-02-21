import clsx from 'clsx';
import { Priority } from '@/types';

interface PriorityIndicatorProps {
  priority: Priority;
  /** When true, renders as a small dot instead of a labelled badge. */
  compact?: boolean;
}

const PRIORITY_CONFIG: Record<
  Priority,
  { label: string; dotClass: string; badgeClass: string }
> = {
  low:      { label: 'Low',      dotClass: 'bg-green-400',  badgeClass: 'bg-green-100 text-green-700' },
  medium:   { label: 'Medium',   dotClass: 'bg-yellow-400', badgeClass: 'bg-yellow-100 text-yellow-700' },
  high:     { label: 'High',     dotClass: 'bg-red-400',    badgeClass: 'bg-red-100 text-red-700' },
  critical: { label: 'Critical', dotClass: 'bg-purple-500', badgeClass: 'bg-purple-100 text-purple-700' },
};

/**
 * Renders a coloured visual indicator for task priority.
 * In compact mode it is a small dot; otherwise it is a labelled pill badge.
 */
export default function PriorityIndicator({ priority, compact = false }: PriorityIndicatorProps) {
  const config = PRIORITY_CONFIG[priority];

  if (compact) {
    return (
      <span
        role="img"
        aria-label={`${config.label} priority`}
        className={clsx('inline-block h-2.5 w-2.5 rounded-full', config.dotClass)}
      />
    );
  }

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.badgeClass,
      )}
      data-testid="priority-badge"
    >
      <span className={clsx('h-1.5 w-1.5 rounded-full', config.dotClass)} aria-hidden />
      {config.label}
    </span>
  );
}
