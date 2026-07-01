'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';
import { cn } from '@/lib/utils';

type ThemeToggleProps = {
  className?: string;
  variant?: 'default' | 'hero';
};

export function ThemeToggle({ className, variant = 'default' }: ThemeToggleProps) {
  const { resolvedTheme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        resolvedTheme === 'dark'
          ? 'Включить светлую тему'
          : 'Включить тёмную тему'
      }
      className={cn(
        'inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors',
        variant === 'hero'
          ? 'border border-white/25 bg-black/20 text-white backdrop-blur-sm hover:bg-black/30'
          : 'rounded-button border border-border bg-surface text-muted hover:border-accent/40 hover:text-accent',
        className,
      )}
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4" />
      ) : (
        <Moon className="h-4 w-4" />
      )}
    </button>
  );
}
