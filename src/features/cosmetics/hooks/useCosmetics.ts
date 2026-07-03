'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/supabase/use-auth';
import {
  fetchCloudProducts,
  mergeProducts,
  upsertCloudProducts,
} from '../api/sync-products';
import { calculateStatus } from '../lib/calculate-status';
import { inferTaxonomy } from '../lib/taxonomy';
import { deleteProductPhoto } from '../lib/product-photo-storage';
import { readCosmetics, writeCosmetics } from '../lib/storage';
import type { AddProductInput, CosmeticItem, UpdateProductInput } from '../types';

const MAX_ACTIVE_PRODUCTS = 300;
const PUSH_DEBOUNCE_MS = 600;

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
  const [syncError, setSyncError] = useState('');
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(getOnlineStatus);
  const [canWriteStorage, setCanWriteStorage] = useState(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [syncAttempt, setSyncAttempt] = useState(0);
  const mergedUserRef = useRef<string | null>(null);
  const suppressPushRef = useRef(false);
  const itemsRef = useRef(items);
  const wasOfflineRef = useRef(false);
  const pushGenerationRef = useRef(0);

  itemsRef.current = items;

  const activeItems = useMemo(
    () => items.filter((item) => !item.deletedAt),
    [items],
  );

  const canSync =
    isLoaded &&
    isOnline &&
    supabase &&
    user &&
    authStatus === 'signed-in';

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
    if (authStatus === 'signed-out') {
      mergedUserRef.current = null;
      setSyncStatus('local');
      setSyncError('');
    }
  }, [authStatus]);

  useEffect(() => {
    if (!isLoaded) return;

    if (!isOnline) {
      wasOfflineRef.current = true;
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
    setSyncError('');

    void fetchCloudProducts(supabase)
      .then(async (cloudItems) => {
        if (cancelled) return;

        const merged = mergeProducts(itemsRef.current, cloudItems);
        suppressPushRef.current = true;
        setItems(merged);
        mergedUserRef.current = user.id;

        await upsertCloudProducts(supabase, user.id, merged);
        if (cancelled) return;

        setSyncStatus('synced');
        setSyncError('');
      })
      .catch(() => {
        if (!cancelled) {
          setSyncError('Не удалось синхронизировать с облаком');
          setSyncStatus('error');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [authStatus, isLoaded, isOnline, supabase, syncAttempt, user]);

  useEffect(() => {
    if (!canSync) return;

    if (suppressPushRef.current) {
      suppressPushRef.current = false;
      return;
    }

    const generation = ++pushGenerationRef.current;
    const timeout = setTimeout(() => {
      if (generation !== pushGenerationRef.current) return;

      setSyncStatus('syncing');
      setSyncError('');

      void upsertCloudProducts(supabase, user.id, itemsRef.current)
        .then(() => {
          if (generation !== pushGenerationRef.current) return;
          setSyncStatus('synced');
          setSyncError('');
        })
        .catch(() => {
          if (generation !== pushGenerationRef.current) return;
          setSyncError('Не удалось синхронизировать с облаком');
          setSyncStatus('error');
        });
    }, PUSH_DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [authStatus, canSync, items, supabase, user]);

  useEffect(() => {
    if (!canSync || !wasOfflineRef.current) return;

    wasOfflineRef.current = false;
    const generation = ++pushGenerationRef.current;

    setSyncStatus('syncing');
    setSyncError('');

    void upsertCloudProducts(supabase, user.id, itemsRef.current)
      .then(() => {
        if (generation !== pushGenerationRef.current) return;
        setSyncStatus('synced');
        setSyncError('');
      })
      .catch(() => {
        if (generation !== pushGenerationRef.current) return;
        setSyncError('Не удалось синхронизировать с облаком');
        setSyncStatus('error');
      });
  }, [canSync, isOnline, supabase, user]);

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

  const retrySync = useCallback(() => {
    if (!supabase || !user || authStatus !== 'signed-in') return;

    const generation = ++pushGenerationRef.current;
    setSyncError('');
    setSyncStatus('syncing');

    if (mergedUserRef.current === user.id) {
      void upsertCloudProducts(supabase, user.id, itemsRef.current)
        .then(() => {
          if (generation !== pushGenerationRef.current) return;
          setSyncStatus('synced');
          setSyncError('');
        })
        .catch(() => {
          if (generation !== pushGenerationRef.current) return;
          setSyncError('Не удалось синхронизировать с облаком');
          setSyncStatus('error');
        });
      return;
    }

    mergedUserRef.current = null;
    setSyncAttempt((attempt) => attempt + 1);
  }, [authStatus, supabase, user]);

  const addItem = useCallback((input: AddProductInput) => {
    setCanWriteStorage(true);
    const now = new Date().toISOString();
    const activeCount = items.filter((item) => !item.deletedAt).length;

    if (activeCount >= MAX_ACTIVE_PRODUCTS) {
      setError(`Лимит полки ${MAX_ACTIVE_PRODUCTS} продуктов на бесплатном тарифе`);
      return;
    }

    const taxonomy = inferTaxonomy(
      input.category,
      `${input.brand} ${input.name}`,
    );

    const item: CosmeticItem = {
      ...input,
      productGroup: input.productGroup ?? taxonomy.group,
      productSubtype: input.productSubtype ?? taxonomy.subtype,
      id: crypto.randomUUID(),
      status: calculateStatus(input.openedAt, input.paoMonths, input.isSealed),
      createdAt: now,
      updatedAt: now,
      lookupSource: input.lookupSource ?? (input.barcode ? 'barcode' : 'manual'),
    };
    setItems((prev) => [item, ...prev]);
  }, [items]);

  const updateItem = useCallback((id: string, input: UpdateProductInput) => {
    setCanWriteStorage(true);
    setItems((prev) => {
      const existing = prev.find((item) => item.id === id);
      const nextImageUrl = input.imageUrl?.trim() || undefined;
      const previousImageUrl = existing?.imageUrl;

      if (
        previousImageUrl &&
        previousImageUrl !== nextImageUrl
      ) {
        void deleteProductPhoto(previousImageUrl);
      }

      return prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...input,
              imageUrl: nextImageUrl,
              productGroup:
                input.productGroup ??
                inferTaxonomy(input.category, `${input.brand} ${input.name}`)
                  .group,
              productSubtype:
                input.productSubtype ??
                inferTaxonomy(input.category, `${input.brand} ${input.name}`)
                  .subtype,
              status: calculateStatus(input.openedAt, input.paoMonths, input.isSealed),
              updatedAt: new Date().toISOString(),
              deletedAt: undefined,
            }
          : item,
      );
    });
  }, []);

  const finalizeDeletion = useCallback((item: CosmeticItem) => {
    void deleteProductPhoto(item.imageUrl);
    setItems((prev) =>
      prev.map((current) =>
        current.id === item.id
          ? { ...current, imageUrl: undefined }
          : current,
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
    finalizeDeletion,
    isLoaded,
    isSaving,
    error,
    syncError,
    lastSavedAt,
    isOnline,
    syncStatus,
    retrySync,
    user,
  };
}
