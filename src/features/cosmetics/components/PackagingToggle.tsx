import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

type PackagingToggleProps = {
  isOpen: boolean;
  onChange: (isOpen: boolean) => void;
};

export function PackagingToggle({ isOpen, onChange }: PackagingToggleProps) {
  const handleChange = (next: boolean) => {
    haptic('light');
    onChange(next);
  };
  return (
    <div>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
        Упаковка
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => handleChange(false)}
          className={cn(
            'touch-target flex h-12 w-full items-center justify-center rounded-full border text-sm font-semibold transition-colors',
            !isOpen
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border bg-surface text-muted active:bg-bg',
          )}
        >
          Закрыто
        </button>
        <button
          type="button"
          onClick={() => handleChange(true)}
          className={cn(
            'touch-target flex h-12 w-full items-center justify-center rounded-full border text-sm font-semibold transition-colors',
            isOpen
              ? 'border-accent bg-accent/10 text-accent'
              : 'border-border bg-surface text-muted active:bg-bg',
          )}
        >
          Вскрыто
        </button>
      </div>
    </div>
  );
}
