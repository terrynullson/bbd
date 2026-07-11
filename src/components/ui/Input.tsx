import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  error?: boolean;
};

export function Input({ className, error, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'min-h-[52px] w-full rounded-[16px] border bg-surface px-4 py-3 text-[15px] text-text outline-none transition-colors placeholder:text-muted/70',
        error
          ? 'border-expired/45 focus:border-expired/70'
          : 'border-border focus:border-accent',
        className,
      )}
      {...props}
    />
  );
}
