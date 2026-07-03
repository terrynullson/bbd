'use client';

import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import {
  getDaysRemaining,
  getLimitingLabel,
  getPaoProgress,
  resolveExpiry,
} from '../lib/calculate-status';
import { expiryParamsFromItem, formatExpiryDate } from '../lib/expiry';
import { getSubtypeLabel } from '../lib/taxonomy';
import { PackagingIcon } from './PackagingIcon';
import type { CosmeticItem } from '../types';

type CosmeticCardProps = {
  item: CosmeticItem;
  onRemove: (id: string) => void;
  onEdit: (item: CosmeticItem) => void;
};

const STATUS_LABELS = {
  fresh: 'Свежий',
  expiring: 'Скоро',
  expired: 'Просрочен',
} as const;

export function CosmeticCard({ item, onRemove, onEdit }: CosmeticCardProps) {
  const params = expiryParamsFromItem(item);
  const isSealed = item.isSealed ?? false;
  const daysRemaining = getDaysRemaining(params);
  const progress = getPaoProgress(params);
  const { limitingFactor } = resolveExpiry(params);
  const limitingLabel = getLimitingLabel(limitingFactor, item.expiresAt);

  const statusLine = (() => {
    if (isSealed && !item.expiresAt) return 'Срок не указан';
    if (isSealed && item.expiresAt) {
      return daysRemaining <= 0
        ? 'Срок истёк'
        : `Годен до ${formatExpiryDate(item.expiresAt)} · ${daysRemaining} дн.`;
    }
    if (item.status === 'expired') return 'Срок истёк';
    return `${daysRemaining} дн. осталось`;
  })();

  return (
    <article className="rounded-[18px] border border-border/80 bg-bg p-4">
      <div className="flex gap-3">
        <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center overflow-hidden rounded-[14px] bg-icon-bg text-accent">
          {item.imageUrl ? (
            <div
              className="h-full w-full bg-cover bg-center"
              style={{ backgroundImage: `url(${item.imageUrl})` }}
              aria-label={item.name}
              role="img"
            />
          ) : (
            <PackagingIcon item={item} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted">
                {getSubtypeLabel(item)}
              </p>
              <h3 className="mt-0.5 font-display text-[1.05rem] font-semibold leading-snug text-text">
                {item.name}
              </h3>
              <p className="mt-0.5 truncate text-xs text-muted">{item.brand}</p>
              {item.barcodeTrust === 'suspicious' && (
                <p className="mt-0.5 text-[10px] text-muted">
                  Штрих-код не проверен
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              <Badge variant={item.status} solid>
                {isSealed && !item.expiresAt
                  ? 'Не открыт'
                  : STATUS_LABELS[item.status]}
              </Badge>
              <button
                type="button"
                onClick={() => onEdit(item)}
                aria-label="Редактировать"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface hover:text-accent"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2.5 border-t border-border/60 pt-3">
        <div className="flex items-center justify-between gap-3 text-[12px] text-muted">
          <span className="min-w-0 shrink">{statusLine}</span>
          <div className="flex min-w-0 items-center gap-2">
            {!isSealed && (
              <span className="truncate">{item.paoMonths}M PAO</span>
            )}
            <button
              type="button"
              onClick={() => onRemove(item.id)}
              aria-label="Удалить"
              className="touch-target inline-flex shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-expired/10 hover:text-expired"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        {limitingLabel && (
          <p className="text-[11px] text-muted">{limitingLabel}</p>
        )}

        <div className="h-1.5 overflow-hidden rounded-full bg-surface">
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
