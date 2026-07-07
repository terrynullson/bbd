import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'min-h-[48px] w-full rounded-[14px] border bg-surface px-4 py-3 text-base text-text outline-none transition-colors placeholder:text-muted/60',
        error
          ? 'border-expired/45 focus:border-expired/70'
          : 'border-border focus:border-accent/50',
        className,
      )}
      {...props}
    />
  );
}
