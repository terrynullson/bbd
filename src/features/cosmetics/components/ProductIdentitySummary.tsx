'use client';

import { ProductPhotoChip } from './ProductPhotoChip';

type ProductIdentitySummaryProps = {
  brand: string;
  name: string;
  barcode: string;
  imageUrl: string;
  lookupSourceLabel: string | null;
  userId?: string | null;
  onImageChange: (url: string) => void;
  onExpand: () => void;
};

function getSummaryLabel(brand: string, name: string) {
  const trimmedBrand = brand.trim();
  const trimmedName = name.trim();
  if (trimmedBrand && trimmedName) return `${trimmedBrand} · ${trimmedName}`;
  return trimmedName || trimmedBrand || 'Без названия';
}

/** Свёрнутое превью найденного товара — режим подтверждения. */
export function ProductIdentitySummary({
  brand,
  name,
  barcode,
  imageUrl,
  lookupSourceLabel,
  userId,
  onImageChange,
  onExpand,
}: ProductIdentitySummaryProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-3">
      <div className="flex items-start gap-3">
        <ProductPhotoChip
          value={imageUrl}
          onChange={onImageChange}
          userId={userId}
        />

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-text">
            {getSummaryLabel(brand, name)}
          </p>
          {lookupSourceLabel && (
            <p className="mt-0.5 text-xs text-muted">{lookupSourceLabel}</p>
          )}
          {barcode.trim() && (
            <p className="mt-0.5 truncate text-xs text-muted">
              ШК: {barcode.trim()}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={onExpand}
          className="shrink-0 text-sm font-medium text-accent underline-offset-2 hover:underline"
        >
          Изменить
        </button>
      </div>
    </div>
  );
}
