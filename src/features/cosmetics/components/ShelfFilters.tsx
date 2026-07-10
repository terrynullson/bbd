import { cn } from '@/lib/utils';
import type { ShelfCounts, ShelfFilter } from '../lib/shelf-filters';

type ShelfFiltersProps = {
  value: ShelfFilter;
  counts: ShelfCounts;
  onChange: (filter: ShelfFilter) => void;
};

const FILTERS: Array<{ id: ShelfFilter; label: string }> = [
  { id: 'all', label: 'Все' },
  { id: 'fresh', label: 'Свежие' },
  { id: 'expiring', label: 'Скоро' },
  { id: 'expired', label: 'Просрочены' },
  { id: 'sealed', label: 'Не открыт' },
];

export function ShelfFilters({ value, counts, onChange }: ShelfFiltersProps) {
  return (
    <div
      className="no-scrollbar -mx-5 overflow-x-auto px-5"
      data-sheet-no-drag
      aria-label="Фильтры полки"
    >
      <div className="flex w-max gap-1.5">
        {FILTERS.map((filter) => {
          const isActive = filter.id === value;
          const count = counts[filter.id];

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onChange(filter.id)}
              aria-pressed={isActive}
              className={cn(
                'motion-safe-transition min-h-[34px] shrink-0 rounded-full border px-3',
                'text-[12.5px] font-semibold transition-all duration-300 active:scale-[0.98]',
                isActive
                  ? 'border-text bg-text text-bg'
                  : 'border-[var(--chip-border)] bg-transparent text-[var(--chip-text)] hover:border-accent/40',
              )}
            >
              {filter.id === 'all' ? filter.label : `${filter.label} · ${count}`}
            </button>
          );
        })}
      </div>
    </div>
  );
}
