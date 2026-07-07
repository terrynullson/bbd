import { cn } from '@/lib/utils';
import { useDesignStyle } from '@/components/theme/style-provider';
import type { ShelfFilter } from '../lib/shelf-filters';

type ShelfFiltersProps = {
  value: ShelfFilter;
  onChange: (filter: ShelfFilter) => void;
};

const FILTERS: Array<{ id: ShelfFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'expiring', label: 'Скоро' },
  { id: 'expired', label: 'Просрочено' },
  { id: 'sealed', label: 'Не открыт' },
];

export function ShelfFilters({ value, onChange }: ShelfFiltersProps) {
  const { designStyle } = useDesignStyle();
  const chipShape =
    designStyle === 'pulse'
      ? 'rounded-[10px]'
      : designStyle === 'riot'
        ? 'rounded-none border-2 font-bold uppercase tracking-wider text-xs'
        : 'rounded-full';

  return (
    <div
      className="-mx-4 overflow-x-auto px-4 py-1"
      data-sheet-no-drag
      aria-label="Фильтры полки"
    >
      <div className="flex w-max gap-2.5">
        {FILTERS.map((filter) => {
          const isActive = filter.id === value;

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onChange(filter.id)}
              className={cn(
                'motion-safe-transition border px-4 py-2.5 text-sm font-medium transition-all duration-300 active:scale-[0.98]',
                chipShape,
                isActive
                  ? 'border-accent/35 bg-accent/12 text-accent'
                  : 'border-border/50 bg-bg text-muted hover:border-accent/25 hover:text-text',
              )}
            >
              {filter.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
