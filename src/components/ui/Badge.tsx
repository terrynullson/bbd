import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BadgeVariant = 'fresh' | 'expiring' | 'expired' | 'neutral';

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  solid?: boolean;
};

const variants: Record<BadgeVariant, string> = {
  fresh: 'bg-fresh/12 text-fresh',
  expiring: 'bg-expiring/12 text-expiring',
  expired: 'bg-expired/12 text-expired',
  neutral: 'bg-surface text-muted border border-border',
};

const solidVariants: Record<BadgeVariant, string> = {
  fresh: 'bg-fresh text-white',
  expiring: 'bg-expiring text-white',
  expired: 'bg-expired text-white',
  neutral: 'bg-muted/20 text-text',
};

export function Badge({
  children,
  variant = 'neutral',
  className,
  solid = false,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]',
        solid ? solidVariants[variant] : variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
