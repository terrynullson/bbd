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
  const isDark = resolvedTheme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={
        isDark
          ? 'Включить светлую тему'
          : 'Включить тёмную тему'
      }
      className={cn(
        'inline-flex h-8 w-[58px] items-center rounded-[10px] border p-0.5 transition-colors',
        variant === 'hero'
          ? 'border-white/35 bg-black/20 text-white backdrop-blur-md hover:bg-black/25'
          : 'border-border bg-surface text-muted hover:border-accent/40',
        className,
      )}
    >
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-[8px] transition-colors',
          isDark
            ? 'bg-white/90 text-[#3f3029]'
            : 'text-white/90',
          variant !== 'hero' && !isDark && 'text-muted',
        )}
      >
        <Moon className="h-3.5 w-3.5" />
      </span>
      <span
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-[8px] transition-colors',
          !isDark
            ? 'bg-white/90 text-[#3f3029]'
            : 'text-white/90',
          variant !== 'hero' && isDark && 'text-muted',
        )}
      >
        <Sun className="h-3.5 w-3.5" />
      </span>
    </button>
  );
}
