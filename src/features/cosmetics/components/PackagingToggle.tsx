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
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text">
          {isOpen ? 'Открыт' : 'Не открыт'}
        </p>
        <button
          type="button"
          role="switch"
          aria-checked={isOpen}
          aria-label={isOpen ? 'Открыт' : 'Не открыт'}
          onClick={() => handleChange(!isOpen)}
          className={cn(
            'relative h-7 w-12 shrink-0 rounded-full transition-colors',
            isOpen ? 'bg-accent' : 'bg-border',
          )}
        >
          <span
            className={cn(
              'absolute top-0.5 h-6 w-6 rounded-full bg-white transition-transform',
              isOpen ? 'translate-x-[22px]' : 'translate-x-0.5',
            )}
          />
        </button>
      </div>
      {!isOpen && (
        <p className="mt-2 text-xs text-muted">
          Срок после вскрытия не идёт. Укажите «Годен до», если есть.
        </p>
      )}
    </div>
  );
}
