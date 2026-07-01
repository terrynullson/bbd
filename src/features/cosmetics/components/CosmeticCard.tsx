'use client';

import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  getDaysRemaining,
  getPaoProgress,
} from '../lib/calculate-status';
import { getCategoryLabel } from '../lib/categories';
import { ProductIllustration } from './ProductIllustration';
import type { CosmeticItem } from '../types';

type CosmeticCardProps = {
  item: CosmeticItem;
  onRemove: (id: string) => void;
};

const STATUS_LABELS = {
  fresh: 'Fresh',
  expiring: 'Expiring',
  expired: 'Expired',
} as const;

export function CosmeticCard({ item, onRemove }: CosmeticCardProps) {
  const daysRemaining = getDaysRemaining(item.openedAt, item.paoMonths);
  const progress = getPaoProgress(item.openedAt, item.paoMonths);

  return (
    <article className="relative rounded-card bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="absolute right-4 top-4">
        <Badge variant={item.status} solid>
          {STATUS_LABELS[item.status]}
        </Badge>
      </div>

      <div className="flex items-start gap-3.5 pr-24">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[14px] bg-icon-bg text-accent">
          <ProductIllustration category={item.category} />
        </div>

        <div className="min-w-0 flex-1 pt-0.5">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
            {getCategoryLabel(item.category)}
          </p>
          <h3 className="mt-1 font-display text-[1.05rem] font-semibold leading-snug text-text">
            {item.name}
          </h3>
          <p className="mt-1 text-xs text-muted">{item.brand}</p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          aria-label="Удалить"
          className="absolute bottom-4 right-4 h-9 w-9 shrink-0 text-muted hover:text-expired"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="mt-4 border-t border-border/70 pt-3">
        <div className="mb-2 flex items-center justify-between text-[11px] text-muted">
          <span>
            {item.status === 'expired'
              ? 'Срок истёк'
              : `${daysRemaining} дн. осталось`}
          </span>
          <span>{item.paoMonths}M PAO</span>
        </div>
        <div className="h-1 overflow-hidden rounded-full bg-bg">
          <div
            className={`h-full rounded-full transition-all ${
              item.status === 'fresh'
                ? 'bg-fresh'
                : item.status === 'expiring'
                  ? 'bg-expiring'
                  : 'bg-expired'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </article>
  );
}
