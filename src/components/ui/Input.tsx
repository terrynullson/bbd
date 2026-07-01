import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'min-h-[48px] w-full rounded-[14px] border border-border bg-surface px-4 py-3 text-base text-text outline-none transition-colors placeholder:text-muted/60 focus:border-accent/50',
        className,
      )}
      {...props}
    />
  );
}
