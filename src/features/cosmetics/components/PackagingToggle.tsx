import { cn } from '@/lib/utils';
import { haptic } from '@/lib/haptics';

type PackagingToggleProps = {
  isOpen: boolean;
  onChange: (isOpen: boolean) => void;
};

export function PackagingToggle({ isOpen, onChange }: PackagingToggleProps) {
  const handleSelect = (next: boolean) => {
    if (next === isOpen) return;
    haptic('light');
    onChange(next);
  };

  return (
    <div
      role="group"
      aria-label="Состояние упаковки"
      className="grid grid-cols-2 gap-1 rounded-[14px] border border-border/70 bg-bg/60 p-1"
    >
      <button
        type="button"
        aria-pressed={!isOpen}
        onClick={() => handleSelect(false)}
        className={cn(
          'rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
          !isOpen
            ? 'bg-surface text-text shadow-sm'
            : 'text-muted hover:text-text',
        )}
      >
        Не открыт
      </button>
      <button
        type="button"
        aria-pressed={isOpen}
        onClick={() => handleSelect(true)}
        className={cn(
          'rounded-[10px] px-3 py-2.5 text-sm font-medium transition-colors',
          isOpen
            ? 'bg-surface text-text shadow-sm'
            : 'text-muted hover:text-text',
        )}
      >
        Открыт
      </button>
    </div>
  );
}
