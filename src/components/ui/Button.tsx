import { cn } from '@/lib/utils';
import type { ButtonHTMLAttributes } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-accent text-accent-foreground hover:bg-accent-hover',
  secondary:
    'bg-surface text-text border border-border hover:border-accent/30',
  ghost: 'bg-transparent text-muted hover:text-text hover:bg-surface/80',
  danger: 'bg-expired/10 text-expired hover:bg-expired/20',
};

const sizes: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm rounded-button',
  md: 'h-11 px-4 text-sm font-medium rounded-button',
  lg: 'h-12 px-5 text-base font-medium rounded-button',
  icon: 'h-11 w-11 rounded-button',
};

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}
