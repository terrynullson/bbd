'use client';

import { ImagePlus, X } from 'lucide-react';
import { useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { uploadProductPhoto } from '../api/upload-product-photo';
import { compressImageToDataUrl } from '../lib/compress-image';
import { deleteProductPhoto } from '../lib/product-photo-storage';

type ProductPhotoPickerProps = {
  value?: string;
  onChange: (value: string) => void;
  userId?: string | null;
};

export function ProductPhotoPicker({
  value,
  onChange,
  userId,
}: ProductPhotoPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handlePick = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setIsLoading(true);
    setError('');

    try {
      if (userId) {
        const url = await uploadProductPhoto(file, userId);
        if (value && value !== url) {
          void deleteProductPhoto(value);
        }
        onChange(url);
        return;
      }

      const dataUrl = await compressImageToDataUrl(file);
      onChange(dataUrl);
    } catch (pickError) {
      setError(
        pickError instanceof Error
          ? pickError.message
          : 'Не удалось обработать фото',
      );
    } finally {
      setIsLoading(false);
    }
  };

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
            className="h-36 bg-cover bg-center"
            style={{ backgroundImage: `url(${value})` }}
          />
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/55 to-transparent p-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="shadow-none"
              disabled={isLoading}
              onClick={() => inputRef.current?.click()}
            >
              {isLoading ? '...' : 'Заменить'}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 bg-black/20 text-white hover:bg-black/35 hover:text-white"
              aria-label="Удалить фото"
              onClick={() => {
                if (value) void deleteProductPhoto(value);
                onChange('');
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          disabled={isLoading}
          onClick={() => inputRef.current?.click()}
          className="flex min-h-[88px] w-full items-center justify-center gap-2 rounded-[14px] border border-dashed border-border/80 bg-surface/60 px-4 py-5 text-sm text-muted transition-colors hover:border-accent/40 hover:text-text"
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
