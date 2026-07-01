'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/supabase/use-auth';
import {
  fetchCloudProducts,
  mergeProducts,
  upsertCloudProducts,
} from '../api/sync-products';
import { calculateStatus } from '../lib/calculate-status';
import { readCosmetics, writeCosmetics } from '../lib/storage';
import type { AddProductInput, CosmeticItem, UpdateProductInput } from '../types';

const MAX_ACTIVE_PRODUCTS = 300;

type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline' | 'error';

function getOnlineStatus() {
  if (typeof navigator === 'undefined') return true;
  return navigator.onLine;
}

export function useCosmetics() {
  const { supabase, user, status: authStatus } = useAuth();
  const [items, setItems] = useState<CosmeticItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(getOnlineStatus);
  const [canWriteStorage, setCanWriteStorage] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const mergedUserRef = useRef<string | null>(null);
  const skipNextCloudPushRef = useRef(false);

  const activeItems = useMemo(
    () => items.filter((item) => !item.deletedAt),
    [items],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        setItems(readCosmetics());
      } catch {
        setError('Не удалось прочитать сохранённые продукты');
        setCanWriteStorage(false);
      }
      setIsLoaded(true);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!isLoaded || !canWriteStorage) return;

    setIsSaving(true);
    try {
      writeCosmetics(items);
      setLastSavedAt(new Date().toISOString());
      setError('');
    } catch {
      setError('Не удалось сохранить изменения на устройстве');
    } finally {
      setIsSaving(false);
    }
  }, [items, isLoaded, canWriteStorage]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isOnline) {
      setSyncStatus('offline');
      return;
    }

    if (!supabase || !user || authStatus !== 'signed-in') {
      setSyncStatus('local');
      return;
    }

    if (mergedUserRef.current === user.id) return;

    let cancelled = false;
    setSyncStatus('syncing');

    void fetchCloudProducts(supabase)
      .then((cloudItems) => {
        if (cancelled) return;
        skipNextCloudPushRef.current = true;
        setItems((current) => mergeProducts(current, cloudItems));
        mergedUserRef.current = user.id;
        setSyncStatus('synced');
      })
      .catch(() => {
        if (!cancelled) {
          setError('Не удалось загрузить облачные продукты');
          setSyncStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authStatus, isLoaded, isOnline, supabase, user]);

  useEffect(() => {
    if (!isLoaded || !isOnline || !supabase || !user || authStatus !== 'signed-in') {
      return;
    }

    if (skipNextCloudPushRef.current) {
      skipNextCloudPushRef.current = false;
      return;
    }

    const timeout = setTimeout(() => {
      setSyncStatus('syncing');
      void upsertCloudProducts(supabase, user.id, items)
        .then(() => {
          setSyncStatus('synced');
          setError('');
        })
        .catch(() => {
          setSyncStatus('error');
          setError('Не удалось синхронизировать продукты');
        });
    }, 600);

    return () => clearTimeout(timeout);
  }, [authStatus, isLoaded, isOnline, items, supabase, user]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const addItem = useCallback((input: AddProductInput) => {
    setCanWriteStorage(true);
    const now = new Date().toISOString();
    const activeCount = items.filter((item) => !item.deletedAt).length;

    if (activeCount >= MAX_ACTIVE_PRODUCTS) {
      setError(`Лимит полки ${MAX_ACTIVE_PRODUCTS} продуктов на бесплатном тарифе`);
      return;
    }

    const item: CosmeticItem = {
      ...input,
      id: crypto.randomUUID(),
      status: calculateStatus(input.openedAt, input.paoMonths),
      createdAt: now,
      updatedAt: now,
      lookupSource: input.lookupSource ?? (input.barcode ? 'barcode' : 'manual'),
    };
    setItems((prev) => [item, ...prev]);
  }, [items]);

  const updateItem = useCallback((id: string, input: UpdateProductInput) => {
    setCanWriteStorage(true);
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...input,
              status: calculateStatus(input.openedAt, input.paoMonths),
              updatedAt: new Date().toISOString(),
              deletedAt: undefined,
            }
          : item,
      ),
    );
  }, []);

  const removeItem = useCallback((id: string): CosmeticItem | null => {
    const item = items.find((current) => current.id === id);
    if (!item) return null;

    setCanWriteStorage(true);
    const now = new Date().toISOString();
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              deletedAt: now,
              updatedAt: now,
            }
          : item,
      ),
    );
    return item;
  }, [items]);

  const restoreItem = useCallback((item: CosmeticItem) => {
    setCanWriteStorage(true);
    setItems((prev) => {
      const now = new Date().toISOString();
      if (prev.some((current) => current.id === item.id)) {
        return prev.map((current) =>
          current.id === item.id
            ? { ...current, deletedAt: undefined, updatedAt: now }
            : current,
        );
      }
      return [{ ...item, deletedAt: undefined, updatedAt: now }, ...prev];
    });
  }, []);

  return {
    items: activeItems,
    addItem,
    updateItem,
    removeItem,
    restoreItem,
    isLoaded,
    isSaving,
    error,
    lastSavedAt,
    isOnline,
    syncStatus,
    user,
  };
}
