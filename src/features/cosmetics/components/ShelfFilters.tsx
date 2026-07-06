import { cn } from '@/lib/utils';
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
                'motion-safe-transition rounded-full border px-4 py-2.5 text-sm font-medium shadow-sm transition-all duration-300 active:scale-[0.98]',
                isActive
                  ? 'border-accent/40 bg-accent/10 text-accent shadow-[0_8px_20px_rgba(193,125,101,0.12)]'
                  : 'border-border/60 bg-bg/75 text-muted hover:border-accent/30 hover:bg-bg hover:text-text',
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
