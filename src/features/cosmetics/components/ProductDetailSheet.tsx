'use client';

import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { haptic } from '@/lib/haptics';
import {
  getDaysRemaining,
  getPaoProgress,
  resolveExpiry,
} from '../lib/calculate-status';
import { expiryParamsFromItem, getLimitingLabel } from '../lib/expiry';
import { plural, remainingText } from '../lib/plural';
import { getSubtypeLabel } from '../lib/taxonomy';
import { StatusRing } from './StatusRing';
import type { CosmeticItem, UpdateProductInput } from '../types';

type ProductDetailSheetProps = {
  item: CosmeticItem;
  onClose: () => void;
  onRemove: (id: string) => void;
  onEdit: (item: CosmeticItem) => void;
  onUpdate: (id: string, input: UpdateProductInput) => void;
};

const STATUS_TINT: Record<CosmeticItem['status'], string> = {
  fresh: 'color-mix(in srgb, var(--fresh) 16%, var(--surface))',
  expiring: 'color-mix(in srgb, var(--expiring) 18%, var(--surface))',
  expired: 'color-mix(in srgb, var(--expired) 16%, var(--surface))',
};

function formatLongDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function toInput(item: CosmeticItem): UpdateProductInput {
  return {
    name: item.name,
    brand: item.brand,
    barcode: item.barcode,
    barcodeSource: item.barcodeSource,
    barcodeTrust: item.barcodeTrust,
    paoSource: item.paoSource,
    productGroup: item.productGroup,
    productSubtype: item.productSubtype,
    paoMonths: item.paoMonths,
    openedAt: item.openedAt,
    expiresAt: item.expiresAt,
    expirySource: item.expirySource,
    isSealed: item.isSealed,
    category: item.category,
    imageUrl: item.imageUrl,
    notes: item.notes,
    lookupSource: item.lookupSource,
  };
}

function Row({
  label,
  value,
  accent = false,
  last = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-[15px] text-sm ${
        last ? '' : 'border-b border-icon-bg'
      }`}
    >
      <span className="shrink-0 text-muted">{label}</span>
      <span
        className="truncate text-right font-semibold"
        style={accent ? { color: 'currentColor' } : undefined}
      >
        {value}
      </span>
    </div>
  );
}

export function ProductDetailSheet({
  item,
  onClose,
  onRemove,
  onEdit,
  onUpdate,
}: ProductDetailSheetProps) {
  const [notes, setNotes] = useState(item.notes ?? '');

  const params = expiryParamsFromItem(item);
  const isSealed = item.isSealed ?? false;
  const { effectiveEnd, limitingFactor } = resolveExpiry(params);
  const hasExpiry = Boolean(effectiveEnd);
  const progress = getPaoProgress(params);
  const daysRemaining = hasExpiry ? getDaysRemaining(params) : 0;
  const remainingPct = hasExpiry ? Math.round(100 - progress) : 0;
  const limitingLabel = getLimitingLabel(limitingFactor, item.expiresAt);

  const statusText = (() => {
    if (!hasExpiry) return 'Срок не указан';
    if (item.status === 'expired') return 'Просрочен — лучше заменить';
    if (item.status === 'expiring')
      return `Скоро истекает · ${remainingText(daysRemaining)}`;
    return `Свежий · ещё ${remainingText(daysRemaining)}`;
  })();

  const saveNotes = () => {
    const trimmed = notes.trim();
    if (trimmed === (item.notes ?? '')) return;
    onUpdate(item.id, { ...toInput(item), notes: trimmed || undefined });
  };

  const handleRenew = () => {
    haptic('medium');
    const today = new Date().toISOString();
    onUpdate(item.id, {
      ...toInput(item),
      openedAt: today,
      isSealed: false,
      notes: notes.trim() || undefined,
    });
    onClose();
  };

  const handleDelete = () => {
    onRemove(item.id);
    onClose();
  };

  return (
    <Modal title="" onClose={onClose}>
      <div className="flex flex-col items-center pb-6 pt-1">
        <StatusRing
          progress={progress}
          status={item.status}
          muted={!hasExpiry}
          size={128}
          radius={54}
          strokeWidth={6}
        >
          {item.imageUrl ? (
            <div
              className="h-24 w-24 rounded-full bg-cover bg-center"
              style={{ backgroundImage: `url(${item.imageUrl})` }}
              role="img"
              aria-label={item.name}
            />
          ) : (
            <>
              <span className="text-[30px] font-light leading-none">
                {hasExpiry ? `${remainingPct}%` : '—'}
              </span>
              <span className="mt-1 text-[11px] tracking-[0.06em] text-muted">
                срока
              </span>
            </>
          )}
        </StatusRing>

        {item.imageUrl && (
          <p className="mt-3 text-[11px] tracking-[0.06em] text-muted">
            {hasExpiry ? `${remainingPct}% срока` : 'срок не указан'}
          </p>
        )}

        <h2 className="mt-5 text-center text-[23px] font-medium text-text">
          {item.name}
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          {item.brand && item.brand !== 'Неизвестный бренд'
            ? `${item.brand} · ${getSubtypeLabel(item)}`
            : getSubtypeLabel(item)}
        </p>

        <div
          className="mt-3.5 rounded-full px-4 py-[7px] text-[12.5px] font-semibold"
          style={{
            background: hasExpiry
              ? STATUS_TINT[item.status]
              : 'var(--icon-bg)',
            color: hasExpiry
              ? `var(--${item.status === 'expiring' ? 'expiring' : item.status})`
              : 'var(--muted)',
          }}
        >
          {statusText}
        </div>
      </div>

      <div className="rounded-card border border-border bg-surface px-5 py-1.5">
        <Row
          label={isSealed ? 'Дата добавления' : 'Дата вскрытия'}
          value={formatLongDate(item.openedAt)}
        />
        <Row
          label="Срок после вскрытия"
          value={
            isSealed
              ? 'не открыт'
              : `${item.paoMonths} ${plural(item.paoMonths, ['месяц', 'месяца', 'месяцев'])}`
          }
        />
        <div
          className="flex items-center justify-between gap-4 py-[15px] text-sm"
          style={{
            color: hasExpiry
              ? `var(--${item.status === 'expiring' ? 'expiring' : item.status})`
              : 'var(--muted)',
          }}
        >
          <span className="shrink-0 text-muted">Годен до</span>
          <span className="truncate text-right font-semibold">
            {effectiveEnd ? formatLongDate(effectiveEnd) : 'не указан'}
          </span>
        </div>
      </div>

      {limitingLabel && (
        <p className="mt-2.5 text-center text-xs text-muted">{limitingLabel}</p>
      )}

      <div className="mt-[18px]">
        <p className="quiet-label mb-2.5">Заметки</p>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          onBlur={saveNotes}
          placeholder="Например: покупала в дьюти-фри, хранить в холодильнике…"
          className="min-h-[92px] w-full resize-none rounded-card border border-border bg-surface px-4 py-3 text-sm text-text placeholder:text-muted/70 focus:border-accent focus:outline-none"
        />
      </div>

      <div className="mt-5 flex gap-2.5">
        <button
          type="button"
          onClick={handleRenew}
          className="motion-safe-transition min-h-[52px] flex-1 rounded-full bg-[var(--nav-pill)] px-4 text-sm font-semibold text-[var(--nav-pill-fg)] transition-all duration-300 active:scale-[0.98]"
        >
          {isSealed ? 'Открыла — начать отсчёт' : 'Вскрыла новую банку'}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          className="motion-safe-transition min-h-[52px] shrink-0 rounded-full border px-[22px] text-sm font-semibold text-expired transition-all duration-300 active:scale-[0.98]"
          style={{
            borderColor: 'color-mix(in srgb, var(--expired) 35%, var(--border))',
          }}
        >
          Удалить
        </button>
      </div>

      <button
        type="button"
        onClick={() => {
          saveNotes();
          onEdit(item);
        }}
        className="motion-safe-transition mt-3 min-h-12 w-full rounded-full text-sm font-medium text-muted transition-colors hover:text-text"
      >
        Редактировать средство
      </button>
    </Modal>
  );
}
