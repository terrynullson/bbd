'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/lib/supabase/use-auth';
import {
  fetchCloudProducts,
  mergeProducts,
  upsertCloudProducts,
} from '../api/sync-products';
import { calculateStatus } from '../lib/calculate-status';
import { inferCategoryFromText } from '../lib/categories';
import { inferTaxonomy } from '../lib/taxonomy';
import { deleteProductPhoto } from '../lib/product-photo-storage';
import { readCosmetics, writeCosmetics } from '../lib/storage';
import { useOnlineStatus } from './useOnlineStatus';
import type { AddProductInput, CosmeticItem, UpdateProductInput } from '../types';

const MAX_ACTIVE_PRODUCTS = 300;
const PUSH_DEBOUNCE_MS = 600;
const SYNC_ERROR_MESSAGE = 'Не удалось синхронизировать с облаком';

/** Без явной категории выводим её из текста — иначе таксономия молча станет `other`. */
function resolveTaxonomy(input: AddProductInput) {
  const text = `${input.brand} ${input.name}`;
  const category = input.category ?? inferCategoryFromText(text);
  return { category, ...inferTaxonomy(category, text) };
}

/** Состояние облачной операции. Публичный `syncStatus` выводится из него. */
type CloudStatus = 'idle' | 'syncing' | 'synced' | 'error';
type SyncStatus = 'local' | 'syncing' | 'synced' | 'offline' | 'error';

export function useCosmetics() {
  const { supabase, user, status: authStatus } = useAuth();
  const isOnline = useOnlineStatus();

  const [items, setItems] = useState<CosmeticItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState('');
  const [canWriteStorage, setCanWriteStorage] = useState(true);
  const [cloudStatus, setCloudStatus] = useState<CloudStatus>('idle');
  const [cloudError, setCloudError] = useState('');
  const [syncAttempt, setSyncAttempt] = useState(0);

  const mergedUserRef = useRef<string | null>(null);
  const suppressPushRef = useRef(false);
  const itemsRef = useRef(items);
  const wasOfflineRef = useRef(false);
  const pushGenerationRef = useRef(0);

  // Реф обновляем после коммита: запись во время рендера ломает конкурентный режим.
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const activeItems = useMemo(
    () => items.filter((item) => !item.deletedAt),
    [items],
  );

  const isSignedIn = Boolean(supabase && user && authStatus === 'signed-in');
  const canSync = isLoaded && isOnline && isSignedIn;

  // Публичные статусы — производные, а не отдельное состояние.
  const syncStatus: SyncStatus = !isOnline
    ? 'offline'
    : !isSignedIn
      ? 'local'
      : cloudStatus === 'idle'
        ? 'local'
        : cloudStatus;

  const syncError = isSignedIn && isOnline ? cloudError : '';
  const isStorageReady = isLoaded && canWriteStorage;

  // Чтение localStorage при монтировании. Обновление состояния здесь неизбежно:
  // на сервере хранилища нет, а первый клиентский рендер обязан совпасть с SSR.
  // Раньше чтение стояло в requestAnimationFrame — в фоновой вкладке кадр не
  // наступал и приложение навсегда зависало на «Загрузка…».
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- чтение внешнего хранилища при монтировании
      setItems(readCosmetics());
    } catch {
      setError('Не удалось прочитать сохранённые продукты');
      setCanWriteStorage(false);
    }
    setIsLoaded(true);
  }, []);

  // Запись в localStorage — синхронизация внешней системы с состоянием.
  // Состояние меняется только при сбое записи.
  useEffect(() => {
    if (!isLoaded || !canWriteStorage) return;

    try {
      writeCosmetics(items);
    } catch {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- только при сбое записи
      setError('Не удалось сохранить изменения на устройстве');
    }
  }, [items, isLoaded, canWriteStorage]);

  useEffect(() => {
    if (!isOnline) wasOfflineRef.current = true;
  }, [isOnline]);

  // Первое слияние с облаком после входа.
  useEffect(() => {
    if (!isLoaded) return;

    if (authStatus === 'signed-out') {
      mergedUserRef.current = null;
      return;
    }

    if (!isOnline || !supabase || !user || authStatus !== 'signed-in') return;
    if (mergedUserRef.current === user.id) return;

    let cancelled = false;
    const generation = ++pushGenerationRef.current;

    void (async () => {
      setCloudStatus('syncing');
      setCloudError('');

      try {
        const cloudItems = await fetchCloudProducts(supabase);
        if (cancelled) return;

        const merged = mergeProducts(itemsRef.current, cloudItems);
        suppressPushRef.current = true;
        setItems(merged);
        mergedUserRef.current = user.id;

        await upsertCloudProducts(supabase, user.id, merged);
        if (cancelled || generation !== pushGenerationRef.current) return;

        setCloudStatus('synced');
        setCloudError('');
      } catch {
        if (cancelled) return;
        setCloudError(SYNC_ERROR_MESSAGE);
        setCloudStatus('error');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authStatus, isLoaded, isOnline, supabase, syncAttempt, user]);

  const pushToCloud = useCallback(async () => {
    if (!supabase || !user) return;

    const generation = ++pushGenerationRef.current;
    setCloudStatus('syncing');
    setCloudError('');

    try {
      await upsertCloudProducts(supabase, user.id, itemsRef.current);
      if (generation !== pushGenerationRef.current) return;
      setCloudStatus('synced');
      setCloudError('');
    } catch {
      if (generation !== pushGenerationRef.current) return;
      setCloudError(SYNC_ERROR_MESSAGE);
      setCloudStatus('error');
    }
  }, [supabase, user]);

  // Отложенная выгрузка изменений.
  useEffect(() => {
    if (!canSync) return;

    if (suppressPushRef.current) {
      suppressPushRef.current = false;
      return;
    }

    const timeout = setTimeout(() => void pushToCloud(), PUSH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [canSync, items, pushToCloud]);

  // Вернулись в сеть — догоняем облако.
  useEffect(() => {
    if (!canSync || !wasOfflineRef.current) return;

    wasOfflineRef.current = false;
    void pushToCloud();
  }, [canSync, pushToCloud]);

  const retrySync = useCallback(() => {
    if (!supabase || !user || authStatus !== 'signed-in') return;

    if (mergedUserRef.current === user.id) {
      void pushToCloud();
      return;
    }

    mergedUserRef.current = null;
    setSyncAttempt((attempt) => attempt + 1);
  }, [authStatus, pushToCloud, supabase, user]);

  const addItem = useCallback((input: AddProductInput) => {
    setCanWriteStorage(true);
    setError('');

    const now = new Date().toISOString();
    const taxonomy = resolveTaxonomy(input);

    const item: CosmeticItem = {
      ...input,
      category: taxonomy.category,
      productGroup: input.productGroup ?? taxonomy.group,
      productSubtype: input.productSubtype ?? taxonomy.subtype,
      id: crypto.randomUUID(),
      status: calculateStatus({
        openedAt: input.openedAt,
        paoMonths: input.paoMonths,
        isSealed: input.isSealed,
        expiresAt: input.expiresAt,
      }),
      createdAt: now,
      updatedAt: now,
      lookupSource: input.lookupSource ?? (input.barcode ? 'barcode' : 'manual'),
    };

    setItems((prev) => {
      const activeCount = prev.filter((current) => !current.deletedAt).length;
      if (activeCount >= MAX_ACTIVE_PRODUCTS) {
        setError(
          `Лимит полки ${MAX_ACTIVE_PRODUCTS} продуктов на бесплатном тарифе`,
        );
        return prev;
      }
      return [item, ...prev];
    });
  }, []);

  const updateItem = useCallback((id: string, input: UpdateProductInput) => {
    setCanWriteStorage(true);
    setError('');

    const nextImageUrl = input.imageUrl?.trim() || undefined;

    // Удаление старого фото — снаружи апдейтера: он обязан быть чистым.
    const previousImageUrl = itemsRef.current.find(
      (item) => item.id === id,
    )?.imageUrl;
    if (previousImageUrl && previousImageUrl !== nextImageUrl) {
      void deleteProductPhoto(previousImageUrl);
    }

    const taxonomy = resolveTaxonomy(input);

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...input,
              imageUrl: nextImageUrl,
              category: taxonomy.category,
              productGroup: input.productGroup ?? taxonomy.group,
              productSubtype: input.productSubtype ?? taxonomy.subtype,
              status: calculateStatus({
                openedAt: input.openedAt,
                paoMonths: input.paoMonths,
                isSealed: input.isSealed,
                expiresAt: input.expiresAt,
              }),
              updatedAt: new Date().toISOString(),
              deletedAt: undefined,
            }
          : item,
      ),
    );
  }, []);

  const finalizeDeletion = useCallback((item: CosmeticItem) => {
    void deleteProductPhoto(item.imageUrl);
    setItems((prev) =>
      prev.map((current) =>
        current.id === item.id ? { ...current, imageUrl: undefined } : current,
      ),
    );
  }, []);

  const removeItem = useCallback((id: string): CosmeticItem | null => {
    const item = itemsRef.current.find((current) => current.id === id);
    if (!item || item.deletedAt) return null;

    setCanWriteStorage(true);
    const now = new Date().toISOString();

    setItems((prev) =>
      prev.map((current) =>
        current.id === id
          ? { ...current, deletedAt: now, updatedAt: now }
          : current,
      ),
    );

    return item;
  }, []);

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
    isStorageReady,
    error,
    syncError,
    isOnline,
    syncStatus,
    retrySync,
    user,
  };
}
