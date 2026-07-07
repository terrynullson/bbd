import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/utils';

type SmartFillButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'inline' | 'standalone';
};

export function SmartFillButton({
  onClick,
  disabled,
  loading,
  variant = 'standalone',
}: SmartFillButtonProps) {
  const isInline = variant === 'inline';

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled || loading}
      title="Подобрать"
      aria-label="Подобрать"
      className={cn(
        'shrink-0 shadow-none',
        isInline ? 'h-9 w-9' : 'h-11 w-11',
      )}
    >
      {loading ? (
        <Spinner />
      ) : (
        <Sparkles className={cn('text-accent', isInline ? 'h-4 w-4' : 'h-4 w-4')} />
      )}
    </Button>
  );
}
