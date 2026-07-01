'use client';

import { useCallback, useEffect, useState } from 'react';
import { calculateStatus } from '../lib/calculate-status';
import { readCosmetics, writeCosmetics } from '../lib/storage';
import type { AddProductInput, CosmeticItem } from '../types';

export function useCosmetics() {
  const [items, setItems] = useState<CosmeticItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setItems(readCosmetics());
      setIsLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      writeCosmetics(items);
    }
  }, [items, isLoaded]);

  const addItem = useCallback((input: AddProductInput) => {
    const item: CosmeticItem = {
      ...input,
      id: crypto.randomUUID(),
      status: calculateStatus(input.openedAt, input.paoMonths),
    };
    setItems((prev) => [item, ...prev]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { items, addItem, removeItem, isLoaded };
}
