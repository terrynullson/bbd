import { PAO_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';

type PaoSelectorProps = {
  value: number;
  onChange: (months: number) => void;
};

export function PaoSelector({ value, onChange }: PaoSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2.5">
      {PAO_OPTIONS.map((months) => (
        <button
          key={months}
          type="button"
          onClick={() => onChange(months)}
          className={cn(
            'touch-target flex h-12 w-full items-center justify-center rounded-full border text-sm font-semibold transition-colors',
            value === months
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border bg-surface text-muted active:bg-bg',
          )}
        >
          {months}M
        </button>
      ))}
    </div>
  );
}
