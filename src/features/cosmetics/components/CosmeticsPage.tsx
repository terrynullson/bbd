'use client';

import { Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PageHero } from '@/components/layout/PageHero';
import { AuthButton } from '@/components/auth/AuthButton';
import { Button } from '@/components/ui/Button';
import { AddProductModal } from './AddProductModal';
import { CosmeticsDashboard } from './CosmeticsDashboard';
import { EmptyState } from './EmptyState';
import { InstallPrompt } from './InstallPrompt';
import { summarizeStatuses } from '../lib/sort-items';
import { useCosmetics } from '../hooks/useCosmetics';
import { APP_VERSION } from '@/lib/constants';
import type { CosmeticItem } from '../types';

export function CosmeticsPage() {
  const {
    items,
    addItem,
    updateItem,
    removeItem,
    restoreItem,
    isLoaded,
    isSaving,
    error,
    syncError,
    lastSavedAt,
    isOnline,
    syncStatus,
    retrySync,
    user,
  } = useCosmetics();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CosmeticItem | null>(null);
  const [deletedItem, setDeletedItem] = useState<CosmeticItem | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: CosmeticItem) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const clearUndoTimer = () => {
    if (!undoTimerRef.current) return;
    clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
  };

  const handleRemove = (id: string) => {
    const removed = removeItem(id);
    if (!removed) return;

    clearUndoTimer();
    setDeletedItem(removed);
    undoTimerRef.current = setTimeout(() => {
      setDeletedItem(null);
      undoTimerRef.current = null;
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (!deletedItem) return;

    restoreItem(deletedItem);
    setDeletedItem(null);
    clearUndoTimer();
  };

  useEffect(() => clearUndoTimer, []);

  if (!isLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        Загрузка...
      </div>
    );
  }

  const summary = summarizeStatuses(items);
  const summaryLine =
    items.length > 0
      ? `${summary.fresh} свежих · ${summary.expiring} истекают · ${summary.expired} просрочено`
      : null;

  const bottomPad = items.length > 0 ? 'pb-[calc(5.5rem+var(--safe-bottom))]' : 'pb-6';
  const toastPosition =
    items.length > 0
      ? 'bottom-[calc(6.25rem+var(--safe-bottom))]'
      : 'bottom-[calc(1rem+var(--safe-bottom))]';
  const isSignedIn = Boolean(user);
  const storageStatus = !isOnline
    ? 'Офлайн · изменения сохраняются на устройстве'
    : error
      ? error
      : syncStatus === 'syncing'
        ? 'Синхронизируем с облаком...'
        : syncError
          ? syncError
          : syncStatus === 'synced' && isSignedIn
            ? 'Синхронизировано с облаком'
            : isSaving
              ? 'Сохраняем...'
              : lastSavedAt
                ? 'Сохранено на устройстве'
                : 'Локальное хранение готово';
  const showSyncRetry = Boolean(syncError && isOnline && isSignedIn);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-bg">
      <PageHero summary={summaryLine} />

      <main
        className={`relative z-10 -mt-5 rounded-t-[28px] bg-surface px-4 pt-6 shadow-[0_-8px_32px_rgba(44,36,32,0.06)] ${bottomPad}`}
      >
        <div className="mb-4">
          <AuthButton />
        </div>

        {items.length === 0 ? (
          <EmptyState onAdd={openAddModal} />
        ) : (
          <CosmeticsDashboard
            items={items}
            onRemove={handleRemove}
            onEdit={openEditModal}
          />
        )}

        <p
          className={`mt-6 text-center text-xs ${
            error || syncError ? 'text-expired' : 'text-muted/70'
          }`}
        >
          {storageStatus}
          {showSyncRetry && (
            <>
              {' · '}
              <button
                type="button"
                onClick={retrySync}
                className="font-semibold text-text underline underline-offset-2"
              >
                Повторить
              </button>
            </>
          )}
        </p>

        <p className="mt-2 pb-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted/60">
          v{APP_VERSION}
        </p>
      </main>

      {items.length > 0 && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border/50 bg-surface/90 px-4 pt-3 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-lg">
            <Button
              size="lg"
              className="h-12 w-full rounded-[14px] text-[15px]"
              onClick={openAddModal}
            >
              <Plus className="h-5 w-5" />
              Добавить продукт
            </Button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <AddProductModal
          item={editingItem}
          localItems={items}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
          }}
          onSubmit={(input) => {
            if (editingItem) {
              updateItem(editingItem.id, input);
              setEditingItem(null);
              return;
            }

            addItem(input);
          }}
        />
      )}

      {deletedItem && (
        <div className={`fixed inset-x-0 z-40 px-4 ${toastPosition}`}>
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-[16px] bg-[#2c2420] px-4 py-3 text-sm text-white shadow-[var(--shadow-modal)]">
            <span className="min-w-0 truncate">
              «{deletedItem.name}» удалён
            </span>
            <button
              type="button"
              onClick={handleUndoDelete}
              className="shrink-0 font-semibold text-[#f0c5b4]"
            >
              Отменить
            </button>
          </div>
        </div>
      )}

      <InstallPrompt />
    </div>
  );
}
