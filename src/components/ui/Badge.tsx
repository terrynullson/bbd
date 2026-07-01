import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

type BadgeVariant = 'fresh' | 'expiring' | 'expired' | 'neutral';

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
};

const variants: Record<BadgeVariant, string> = {
  fresh: 'bg-fresh/12 text-fresh',
  expiring: 'bg-expiring/12 text-expiring',
  expired: 'bg-expired/12 text-expired',
  neutral: 'bg-surface text-muted border border-border',
};

export function Badge({ children, variant = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
