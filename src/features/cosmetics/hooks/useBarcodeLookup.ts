'use client';

import { useCallback, useState } from 'react';
import { lookupProductByBarcode } from '../api/lookup-product';
import type { LookupProductResponse } from '../types';

const NOT_FOUND_MESSAGE =
  'Штрих-код не найден. Заполните остальные поля вручную.';

type UseBarcodeLookupOptions = {
  onFound: (code: string, result: LookupProductResponse) => void;
  onNotFound?: (code: string) => void;
};

/** Поиск товара по штрих-коду с состоянием загрузки и ошибки. */
export function useBarcodeLookup({
  onFound,
  onNotFound,
}: UseBarcodeLookupOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const clearError = useCallback(() => setError(''), []);

  const lookup = useCallback(
    async (code: string) => {
      setError('');
      setIsLoading(true);

      try {
        const result = await lookupProductByBarcode(code);

        if (result.found && result.name) {
          onFound(code, result);
          return;
        }

        onNotFound?.(code);
        setError(NOT_FOUND_MESSAGE);
      } catch (lookupError) {
        setError(
          lookupError instanceof Error
            ? lookupError.message
            : 'Не удалось проверить штрих-код',
        );
      } finally {
        setIsLoading(false);
      }
    },
    [onFound, onNotFound],
  );

  return { isLoading, error, clearError, lookup };
}
