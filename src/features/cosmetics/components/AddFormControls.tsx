'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

/** Поля и кнопки листа добавления — единый вид для трёх вкладок. */
export const inputClass =
  'min-h-[52px] w-full rounded-[16px] border border-border bg-surface px-4 text-[15px] text-text placeholder:text-muted/70 focus:border-accent focus:outline-none';

export const primaryButtonClass =
  'motion-safe-transition min-h-[54px] w-full rounded-full bg-[var(--nav-pill)] px-4 text-[15px] font-semibold text-[var(--nav-pill-fg)] transition-all duration-300 active:scale-[0.98] disabled:opacity-50';

export const ghostButtonClass =
  'min-h-11 w-full text-sm text-muted transition-colors hover:text-text';

export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'motion-safe-transition min-h-[42px] shrink-0 rounded-full border px-4 text-[13px] font-semibold transition-all duration-300 active:scale-[0.98]',
        active
          ? 'border-text bg-text text-bg'
          : 'border-[var(--chip-border)] bg-transparent text-[var(--chip-text)]',
      )}
    >
      {children}
    </button>
  );
}
