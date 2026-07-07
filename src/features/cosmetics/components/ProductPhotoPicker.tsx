'use client';

import { ImagePlus, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useProductPhotoPick } from '../hooks/useProductPhotoPick';

type ProductPhotoPickerProps = {
  value?: string;
  onChange: (value: string) => void;
  userId?: string | null;
  compact?: boolean;
};

export function ProductPhotoPicker({
  value,
  onChange,
  userId,
  compact = false,
}: ProductPhotoPickerProps) {
  const { inputRef, isLoading, error, openPicker, handlePick, removePhoto } =
    useProductPhotoPick({ value, onChange, userId });

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(event) => void handlePick(event)}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-[14px] border border-border bg-surface">
          <div
            className={compact ? 'h-24 bg-cover bg-center' : 'h-36 bg-cover bg-center'}
            style={{ backgroundImage: `url(${value})` }}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/55 to-transparent p-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shadow-none"
              disabled={isLoading}
              onClick={openPicker}
            >
              {isLoading ? '...' : 'Заменить'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-black/20 text-white hover:bg-black/35 hover:text-white"
              aria-label="Удалить фото"
              onClick={removePhoto}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={openPicker}
          className={
            compact
              ? 'flex min-h-[64px] w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-border/80 bg-surface/60 px-4 py-3 text-sm text-muted transition-colors hover:border-accent/40 hover:text-text'
              : 'flex min-h-[88px] w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-border/80 bg-surface/60 px-4 py-5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-text'
          }
        >
          <ImagePlus className="h-5 w-5 shrink-0 text-accent" />
          <span>{isLoading ? 'Сжимаем фото...' : 'Добавить фото'}</span>
        </button>
      )}

      <p className="mt-2 text-xs text-muted">
        {userId
          ? 'Фото сжимается и сохраняется в облаке.'
          : 'Фото сжимается и хранится на устройстве. Войдите, чтобы синхронизировать.'}
      </p>

      {error && <p className="mt-1 text-xs text-expired">{error}</p>}
    </div>
  );
}
