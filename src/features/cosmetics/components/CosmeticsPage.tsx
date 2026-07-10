'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { ShelfHeader } from './ShelfHeader';
import { AddProductModal } from './AddProductModal';
import { QuickAddSheet } from './QuickAddSheet';
import { ProfileSheet } from './ProfileSheet';
import { ProductDetailSheet } from './ProductDetailSheet';
import { CosmeticsDashboard } from './CosmeticsDashboard';
import { EmptyState } from './EmptyState';
import { ShelfFilters } from './ShelfFilters';
import { ShelfTip } from './ShelfTip';
import { InstallPrompt } from './InstallPrompt';
import {
  applyShelfFilter,
  countShelfFilters,
  type ShelfFilter,
} from '../lib/shelf-filters';
import { useCosmetics } from '../hooks/useCosmetics';
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
    isStorageReady,
    error,
    syncError,
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
  const [detailItem, setDetailItem] = useState<CosmeticItem | null>(null);
  const [shelfFilter, setShelfFilter] = useState<ShelfFilter>('all');
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mainRef = useRef<HTMLElement>(null);

  const isSheetOpen =
    isQuickAddOpen || isProfileOpen || isModalOpen || detailItem !== null;
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
    setDetailItem(null);
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

  const filteredItems = useMemo(
    () => applyShelfFilter(items, shelfFilter),
    [items, shelfFilter],
  );

  const counts = useMemo(() => countShelfFilters(items), [items]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg text-muted">
        Загрузка...
      </div>
    );
  }

  const needsAttention = counts.expiring + counts.expired;
  const userName = user?.email ? user.email.split('@')[0] : null;

  const toastPosition = isSheetOpen
    ? 'bottom-[calc(1rem+var(--safe-bottom))]'
    : 'bottom-[calc(6.25rem+var(--safe-bottom))]';

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
    <div className="mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden bg-bg shadow-[0_0_60px_rgba(46,42,36,0.08)]">
      <main
        ref={mainRef}
        className="content-enter relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-none px-5 pb-[calc(8rem+var(--safe-bottom))] pt-[max(1.75rem,var(--safe-top))]"
      >
        <ShelfHeader
          total={items.length}
          needsAttention={needsAttention}
          userName={userName}
        />

        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="mb-4 mt-5">
              <ShelfFilters
                value={shelfFilter}
                counts={counts}
                onChange={setShelfFilter}
              />
            </div>

            <ShelfTip />

            {filteredItems.length > 0 ? (
              <CosmeticsDashboard
                items={filteredItems}
                onRemove={handleRemove}
                onOpen={setDetailItem}
              />
            ) : (
              <p className="rounded-card border border-border bg-surface px-4 py-9 text-center text-sm text-muted">
                Нет средств по этому фильтру
              </p>
            )}

            <p className="mt-6 text-center text-xs text-muted/70">
              Свайпните влево, чтобы удалить
            </p>
          </>
        )}
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
          onManualFill={(draft) => openManualAdd(draft)}
          onSubmit={addItem}
        />
      )}

      {detailItem && (
        <ProductDetailSheet
          item={
            items.find((candidate) => candidate.id === detailItem.id) ??
            detailItem
          }
          onClose={() => setDetailItem(null)}
          onRemove={handleRemove}
          onEdit={openEditModal}
          onUpdate={updateItem}
        />
      )}

      {isProfileOpen && (
        <ProfileSheet
          onClose={() => {
            setIsProfileOpen(false);
            setActiveTab('shelf');
          }}
          items={items}
          isOnline={isOnline}
          error={error}
          syncStatus={syncStatus}
          syncError={syncError}
          isStorageReady={isStorageReady}
          isSignedIn={isSignedIn}
          onRetrySync={retrySync}
        />
      )}

      {isModalOpen && (
        <AddProductModal
          // Форма читает начальные значения один раз — при смене товара нужен свежий монтаж.
          key={editingItem?.id ?? 'new'}
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
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-full bg-[var(--nav-pill)] px-5 py-3.5 text-sm text-[var(--nav-pill-fg)]">
            <span className="min-w-0 truncate">
              «{deletedItem.name}» удалён
            </span>
            <button
              type="button"
              onClick={handleUndoDelete}
              className="shrink-0 font-semibold text-accent"
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
