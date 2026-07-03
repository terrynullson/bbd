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
      className="-mx-4 overflow-x-auto px-4 pb-1"
      data-sheet-no-drag
      aria-label="Фильтры полки"
    >
      <div className="flex w-max gap-2">
        {FILTERS.map((filter) => {
          const isActive = filter.id === value;

          return (
            <button
              key={filter.id}
              type="button"
              onClick={() => onChange(filter.id)}
              className={cn(
                'rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'border-accent bg-accent/10 text-accent'
                  : 'border-border/70 bg-bg text-muted hover:border-accent/40 hover:text-text',
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
