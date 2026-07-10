'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchProductSuggestions } from '../api/suggest-products';
import {
  filterLocalBrands,
  filterLocalProducts,
  mergeSuggestions,
} from '../lib/suggestions';
import { useSuggestionKeyboard } from '../components/SuggestionDropdown';
import type { CosmeticItem, ProductSuggestion } from '../types';

const DEBOUNCE_MS = 250;

type UseSuggestionsOptions = {
  type: 'brand' | 'product';
  query: string;
  /** Сужает поиск товаров по бренду. */
  brand?: string;
  localItems: CosmeticItem[];
  minChars?: number;
  /** Пока false — сеть не дёргаем и список пуст. */
  enabled?: boolean;
  onPick: (suggestion: ProductSuggestion) => void;
};

/**
 * Локальные совпадения + подсказки с сервера (с дебаунсом), объединённые и
 * дедуплицированные, вместе с управлением подсветкой и клавиатурой.
 */
export function useSuggestions({
  type,
  query,
  brand,
  localItems,
  minChars = 2,
  enabled = true,
  onPick,
}: UseSuggestionsOptions) {
  const [remote, setRemote] = useState<ProductSuggestion[]>([]);
  const [highlight, setHighlight] = useState<number | null>(null);
  const [lastQuery, setLastQuery] = useState(query);

  const shouldQuery = enabled && query.trim().length >= minChars;

  useEffect(() => {
    if (!shouldQuery) return;

    const timeout = setTimeout(() => {
      void fetchProductSuggestions({ type, query, brand })
        .then(setRemote)
        .catch(() => setRemote([]));
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [type, query, brand, shouldQuery]);

  const local = useMemo(
    () =>
      !shouldQuery
        ? []
        : type === 'brand'
          ? filterLocalBrands(localItems, query)
          : filterLocalProducts(localItems, query, brand),
    [type, query, brand, localItems, shouldQuery],
  );

  // Пока запрос слишком короткий, старые серверные подсказки не показываем.
  const suggestions = useMemo(
    () => mergeSuggestions(local, shouldQuery ? remote : []),
    [local, remote, shouldQuery],
  );

  // Сброс подсветки при смене запроса — во время рендера, не эффектом.
  if (lastQuery !== query) {
    setLastQuery(query);
    setHighlight(null);
  }

  const highlightIndex =
    suggestions.length === 0
      ? -1
      : highlight === null
        ? 0
        : Math.min(Math.max(highlight, -1), suggestions.length - 1);

  const handleKeyDown = useSuggestionKeyboard({
    suggestions,
    highlightIndex,
    setHighlightIndex: setHighlight,
    onPick,
    enabled,
  });

  return {
    suggestions,
    highlightIndex,
    setHighlightIndex: setHighlight,
    handleKeyDown,
  };
}
