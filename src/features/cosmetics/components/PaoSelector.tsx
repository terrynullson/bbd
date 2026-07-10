import { PAO_OPTIONS } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { PaoJarIcon } from './PaoJarIcon';

type PaoSelectorProps = {
  value: number;
  onChange: (months: number) => void;
};

export function PaoSelector({ value, onChange }: PaoSelectorProps) {
  return (
    <div className="grid grid-cols-5 gap-2">
      {PAO_OPTIONS.map((months) => {
        const selected = value === months;

        return (
          <button
            key={months}
            type="button"
            onClick={() => onChange(months)}
            aria-label={`${months} месяцев после вскрытия`}
            aria-pressed={selected}
            className={cn(
              'flex flex-col items-center justify-center gap-0.5 rounded-[12px] border py-2 transition-colors',
              selected
                ? 'border-accent bg-accent/10 text-accent'
                : 'border-border/70 bg-surface text-muted active:bg-bg',
            )}
          >
            <PaoJarIcon months={months} selected={selected} />
          </button>
        );
      })}
    </div>
  );
}
