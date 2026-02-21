import clsx from 'clsx';
import { Category } from '@/types';

interface CategoryBadgeProps {
  category: Category;
}

const CATEGORY_CONFIG: Record<Category, { label: string; className: string; emoji: string }> = {
  work:     { label: 'Work',     className: 'bg-blue-100 text-blue-700',   emoji: '💼' },
  personal: { label: 'Personal', className: 'bg-pink-100 text-pink-700',   emoji: '🏠' },
  shopping: { label: 'Shopping', className: 'bg-orange-100 text-orange-700', emoji: '🛒' },
  health:   { label: 'Health',   className: 'bg-teal-100 text-teal-700',   emoji: '💪' },
  other:    { label: 'Other',    className: 'bg-gray-100 text-gray-600',   emoji: '📌' },
};

/**
 * Renders a small coloured badge for the task category, with an emoji icon.
 */
export default function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = CATEGORY_CONFIG[category];
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className,
      )}
      data-testid="category-badge"
    >
      <span aria-hidden>{config.emoji}</span>
      {config.label}
    </span>
  );
}
