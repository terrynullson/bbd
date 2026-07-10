'use client';

import { useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { getDaysRemaining, getPaoProgress, resolveExpiry } from '../lib/calculate-status';
import { expiryParamsFromItem, formatExpiryDate } from '../lib/expiry';
import { daysLeftLine } from '../lib/plural';
import { getSubtypeLabel } from '../lib/taxonomy';
import { StatusRing } from './StatusRing';
import type { CosmeticItem } from '../types';

type CosmeticCardProps = {
  item: CosmeticItem;
  onRemove: (id: string) => void;
  onOpen: (item: CosmeticItem) => void;
};

const DELETE_WIDTH = 88;
const SETTLE_THRESHOLD = DELETE_WIDTH / 2;
const UNKNOWN_BRAND = 'Неизвестный бренд';

export function CosmeticCard({ item, onRemove, onOpen }: CosmeticCardProps) {
  const [offset, setOffset] = useState(0);
  const [dragging, setDragging] = useState(false);
  const startXRef = useRef(0);
  const baseRef = useRef(0);
  const movedRef = useRef(false);

  const params = expiryParamsFromItem(item);
  const isSealed = item.isSealed ?? false;
  const { effectiveEnd } = resolveExpiry(params);
  const hasExpiry = Boolean(effectiveEnd);
  const daysRemaining = hasExpiry ? getDaysRemaining(params) : 0;
  const progress = getPaoProgress(params);

  const ringLabel = !hasExpiry
    ? '—'
    : item.status === 'expired'
      ? '!'
      : String(daysRemaining);

  const statusText = (() => {
    if (!hasExpiry) return 'срок не указан';
    if (isSealed && item.expiresAt) {
      return `не открыт · до ${formatExpiryDate(item.expiresAt)}`;
    }
    return daysLeftLine(daysRemaining);
  })();

  // Бренд информативнее подтипа; ярлык подтипа отбрасываем, если он повторяет название.
  const brand = item.brand && item.brand !== UNKNOWN_BRAND ? item.brand : null;
  const subtypeLabel = getSubtypeLabel(item);
  const prefix =
    brand ?? (subtypeLabel === item.name ? null : subtypeLabel);
  const subLine = prefix ? `${prefix} · ${statusText}` : statusText;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    startXRef.current = event.clientX;
    baseRef.current = offset;
    movedRef.current = false;
    setDragging(true);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || event.buttons === 0) return;
    const dx = event.clientX - startXRef.current;
    if (Math.abs(dx) > 4) movedRef.current = true;
    const next = Math.min(0, Math.max(-DELETE_WIDTH, baseRef.current + dx));
    setOffset(next);
  };

  const handlePointerUp = () => {
    if (!dragging) return;
    setDragging(false);
    setOffset(offset < -SETTLE_THRESHOLD ? -DELETE_WIDTH : 0);
  };

  const handleOpen = () => {
    if (movedRef.current || offset < -4) {
      setOffset(0);
      return;
    }
    onOpen(item);
  };

  return (
    <div className="relative overflow-hidden rounded-card bg-expired">
      <div className="absolute inset-0 flex items-stretch justify-end">
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label={`Удалить «${item.name}»`}
          className="min-h-12 w-[88px] text-[13px] font-semibold text-surface"
        >
          Удалить
        </button>
      </div>

      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            onOpen(item);
          }
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ transform: `translateX(${offset}px)` }}
        className={cn(
          'shelf-row relative grid cursor-pointer grid-cols-[48px_1fr_auto] items-center gap-3.5',
          'rounded-card border border-border bg-surface px-4 py-3.5',
          !dragging && 'shelf-row-settled',
        )}
      >
        <StatusRing progress={progress} status={item.status} muted={!hasExpiry}>
          <span className="text-[13px] font-bold">{ringLabel}</span>
        </StatusRing>

        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold text-text">
            {item.name}
          </p>
          <p className="mt-0.5 truncate text-[12.5px] text-muted">{subLine}</p>
        </div>

        <span
          aria-hidden
          className="text-lg font-light"
          style={{ color: 'var(--chevron)' }}
        >
          ›
        </span>
      </div>
    </div>
  );
}
