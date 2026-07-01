'use client';

import {
  Droplets,
  FlaskConical,
  Sparkles,
  SprayCan,
  Trash2,
  Waves,
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  getDaysRemaining,
  getPaoProgress,
} from '../lib/calculate-status';
import { getCategoryLabel } from '../lib/categories';
import { formatDateRu } from '@/lib/utils';
import type { CosmeticItem } from '../types';

type CosmeticCardProps = {
  item: CosmeticItem;
  onRemove: (id: string) => void;
};

const STATUS_LABELS = {
  fresh: 'Свежий',
  expiring: 'Истекает',
  expired: 'Просрочен',
} as const;

function CategoryIcon({ category = 'other' }: { category?: CosmeticItem['category'] }) {
  const className = 'h-5 w-5';

  switch (category) {
    case 'serum':
      return <FlaskConical className={className} />;
    case 'toner':
      return <Droplets className={className} />;
    case 'cleanser':
      return <Waves className={className} />;
    case 'mask':
      return <Sparkles className={className} />;
    case 'cream':
      return <SprayCan className={className} />;
    default:
      return <Droplets className={className} />;
  }
}

export function CosmeticCard({ item, onRemove }: CosmeticCardProps) {
  const daysRemaining = getDaysRemaining(item.openedAt, item.paoMonths);
  const progress = getPaoProgress(item.openedAt, item.paoMonths);

  return (
    <article className="rounded-card border border-border bg-surface p-4 shadow-[var(--shadow-card)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-button bg-bg text-accent">
          <CategoryIcon category={item.category} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              {item.brand}
            </span>
            <Badge variant={item.status}>{STATUS_LABELS[item.status]}</Badge>
          </div>

          <h3 className="font-display text-lg font-semibold leading-tight text-text">
            {item.name}
          </h3>

          <p className="mt-1 text-sm text-muted">
            {getCategoryLabel(item.category)} · Вскрыт {formatDateRu(item.openedAt)} ·{' '}
            {item.paoMonths} мес.
          </p>

          <div className="mt-4">
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted">
              <span>Срок после вскрытия</span>
              <span className="font-medium text-text">
                {item.status === 'expired'
                  ? 'Срок истёк'
                  : `${daysRemaining} дн. осталось`}
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-bg">
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
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onRemove(item.id)}
          aria-label="Удалить"
          className="shrink-0 text-muted hover:text-expired"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </article>
  );
}
