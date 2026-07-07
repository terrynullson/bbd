'use client';

import { useRef, useState } from 'react';
import { uploadProductPhoto } from '../api/upload-product-photo';
import { compressImageToDataUrl } from '../lib/compress-image';
import { deleteProductPhoto } from '../lib/product-photo-storage';

type UseProductPhotoPickOptions = {
  value?: string;
  onChange: (value: string) => void;
  userId?: string | null;
};

export function useProductPhotoPick({
  value,
  onChange,
  userId,
}: UseProductPhotoPickOptions) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const openPicker = () => {
    inputRef.current?.click();
  };

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

  const removePhoto = () => {
    if (value) void deleteProductPhoto(value);
    onChange('');
  };

  return {
    inputRef,
    isLoading,
    error,
    openPicker,
    handlePick,
    removePhoto,
  };
}
