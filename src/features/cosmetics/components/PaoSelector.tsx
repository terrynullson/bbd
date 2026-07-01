import { PAO_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

type PaoSelectorProps = {
  value: number;
  onChange: (months: number) => void;
};

export function PaoSelector({ value, onChange }: PaoSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {PAO_OPTIONS.map((months) => (
        <button
          key={months}
          type="button"
          onClick={() => onChange(months)}
          className={cn(
            'rounded-button border px-3 py-2.5 text-sm font-medium transition-colors',
            value === months
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border bg-surface text-muted hover:border-accent/30',
          )}
        >
          {months}M
        </button>
      ))}
    </div>
  );
}
