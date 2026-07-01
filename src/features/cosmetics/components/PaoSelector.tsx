import { PAO_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

type PaoSelectorProps = {
  value: number;
  onChange: (months: number) => void;
};

export function PaoSelector({ value, onChange }: PaoSelectorProps) {
  return (
    <div className="flex gap-3">
      {PAO_OPTIONS.map((months) => (
        <button
          key={months}
          type="button"
          onClick={() => onChange(months)}
          className={cn(
            'flex h-12 w-12 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
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
