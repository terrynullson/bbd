import { cn } from '@/lib/utils';
import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-[14px] border border-border bg-surface px-4 py-3.5 text-sm text-text outline-none transition-colors placeholder:text-muted/60 focus:border-accent/45',
        className,
      )}
      {...props}
    />
  );
}
