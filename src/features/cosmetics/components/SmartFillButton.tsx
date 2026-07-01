import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';

type SmartFillButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function SmartFillButton({
  onClick,
  disabled,
  loading,
}: SmartFillButtonProps) {
  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      onClick={onClick}
      disabled={disabled || loading}
      title="Умное заполнение"
      aria-label="Умное заполнение"
      className="shrink-0"
    >
      {loading ? <Spinner /> : <Sparkles className="h-4 w-4 text-accent" />}
    </Button>
  );
}
