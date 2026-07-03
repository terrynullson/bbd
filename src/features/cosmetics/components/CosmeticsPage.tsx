'use client';

import { useEffect, useRef, useState } from 'react';
import { PageHero } from '@/components/layout/PageHero';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { AddProductModal } from './AddProductModal';
import { QuickAddSheet } from './QuickAddSheet';
import { ProfileSheet } from './ProfileSheet';
import { CosmeticsDashboard } from './CosmeticsDashboard';
import { EmptyState } from './EmptyState';
import { InstallPrompt } from './InstallPrompt';
import { summarizeStatuses } from '../lib/sort-items';
import { useCosmetics } from '../hooks/useCosmetics';
import { APP_VERSION } from '@/lib/constants';
import { haptic } from '@/lib/haptics';
import type { AddProductInput, CosmeticItem } from '../types';

type NavTab = 'shelf' | 'account';

export function CosmeticsPage() {
  const {
    items,
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
  } = useCosmetics();
  const [activeTab, setActiveTab] = useState<NavTab>('shelf');
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<CosmeticItem | null>(null);
  const [manualInitial, setManualInitial] = useState<Partial<AddProductInput>>();
  const [quickAddDraft, setQuickAddDraft] = useState<Partial<AddProductInput>>();
  const [deletedItem, setDeletedItem] = useState<CosmeticItem | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  const isSheetOpen = isQuickAddOpen || isProfileOpen || isModalOpen;
  const isSignedIn = Boolean(user);

  const openQuickAdd = (draft?: Partial<AddProductInput>) => {
    setActiveTab('shelf');
    setQuickAddDraft(draft);
    setIsQuickAddOpen(true);
  };

  const openManualAdd = (draft?: Partial<AddProductInput>) => {
    setIsQuickAddOpen(false);
    setQuickAddDraft(undefined);
    setEditingItem(null);
    setManualInitial(draft);
    setIsModalOpen(true);
  };

  const openEditModal = (item: CosmeticItem) => {
    setEditingItem(item);
    setManualInitial(undefined);
    setQuickAddDraft(undefined);
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

    if (deletedItem) {
      finalizeDeletion(deletedItem);
    }

    clearUndoTimer();
    setDeletedItem(removed);
    haptic('medium');
    undoTimerRef.current = setTimeout(() => {
      finalizeDeletion(removed);
      setDeletedItem(null);
      undoTimerRef.current = null;
    }, 5000);
  };

  const handleUndoDelete = () => {
    if (!deletedItem) return;
    restoreItem(deletedItem);
    setDeletedItem(null);
    clearUndoTimer();
    haptic('light');
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

  const toastPosition = isSheetOpen
    ? 'bottom-[calc(1rem+var(--safe-bottom))]'
    : 'bottom-[calc(6.25rem+var(--safe-bottom))]';

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

  const handleShelfPress = () => {
    setActiveTab('shelf');
    setIsProfileOpen(false);
    mainRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAccountPress = () => {
    setActiveTab('account');
    setIsProfileOpen(true);
  };

  return (
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col bg-bg">
      <PageHero summary={summaryLine} />

      <main
        ref={mainRef}
        className="content-enter relative z-10 -mt-6 flex-1 overflow-x-hidden overflow-y-auto overscroll-y-none rounded-t-[var(--radius-sheet)] bg-surface px-4 pt-6 shadow-[0_-8px_32px_rgba(44,36,32,0.06)] pb-[calc(5.5rem+var(--safe-bottom))]"
      >
        {items.length === 0 ? (
          <EmptyState />
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

      <BottomNavBar
        activeTab={activeTab}
        isSignedIn={isSignedIn}
        isHidden={isSheetOpen}
        onShelfPress={handleShelfPress}
        onAddPress={() => openQuickAdd()}
        onAccountPress={handleAccountPress}
      />

      {isQuickAddOpen && (
        <QuickAddSheet
          localItems={items}
          initialDraft={quickAddDraft}
          onClose={() => {
            setIsQuickAddOpen(false);
            setQuickAddDraft(undefined);
          }}
          onSubmit={(input) => addItem(input)}
          onManualFill={(draft) => openManualAdd(draft)}
        />
      )}

      {isProfileOpen && (
        <ProfileSheet
          onClose={() => {
            setIsProfileOpen(false);
            setActiveTab('shelf');
          }}
        />
      )}

      {isModalOpen && (
        <AddProductModal
          item={editingItem}
          initialValues={manualInitial}
          localItems={items}
          onClose={() => {
            setIsModalOpen(false);
            setEditingItem(null);
            setManualInitial(undefined);
          }}
          onQuickAdd={(draft) => {
            setIsModalOpen(false);
            setEditingItem(null);
            setManualInitial(undefined);
            openQuickAdd(draft);
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
        <div className={`toast-enter fixed inset-x-0 z-40 px-4 ${toastPosition}`}>
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
