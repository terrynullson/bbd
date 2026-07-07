'use client';

import { ImagePlus, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProductPhotoPick } from '../hooks/useProductPhotoPick';

type ProductPhotoChipProps = {
  value?: string;
  onChange: (value: string) => void;
  userId?: string | null;
  className?: string;
};

export function ProductPhotoChip({
  value,
  onChange,
  userId,
  className,
}: ProductPhotoChipProps) {
  const { inputRef, isLoading, error, openPicker, handlePick, removePhoto } =
    useProductPhotoPick({ value, onChange, userId });

  return (
    <div className={cn('relative shrink-0', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void handlePick(event)}
      />

      <button
        type="button"
        disabled={isLoading}
        onClick={openPicker}
        aria-label={value ? 'Заменить фото' : 'Добавить фото'}
        className={cn(
          'relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[10px] border transition-colors',
          value
            ? 'border-border/70 bg-surface'
            : 'border-dashed border-border/80 bg-accent/5 hover:border-accent/40',
        )}
      >
        {value ? (
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${value})` }}
          />
        ) : isLoading ? (
          <span className="text-[10px] text-muted">...</span>
        ) : (
          <ImagePlus className="h-5 w-5 text-accent" />
        )}
      </button>

      {value && !isLoading && (
        <button
          type="button"
          onClick={removePhoto}
          aria-label="Удалить фото"
          className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-border/60 bg-surface text-muted shadow-sm hover:text-text"
        >
          <X className="h-3 w-3" />
        </button>
      )}

      {error && (
        <p className="absolute left-0 top-full mt-1 w-32 text-[10px] leading-tight text-expired">
          {error}
        </p>
      )}
    </div>
  );
}
