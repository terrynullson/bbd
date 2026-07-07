'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { PageHero } from '@/components/layout/PageHero';
import { BottomNavBar } from '@/components/layout/BottomNavBar';
import { AddProductModal } from './AddProductModal';
import { QuickAddSheet } from './QuickAddSheet';
import { ProfileSheet } from './ProfileSheet';
import { CosmeticsDashboard } from './CosmeticsDashboard';
import { EmptyState } from './EmptyState';
import { ShelfFilters } from './ShelfFilters';
import { ShelfTip } from './ShelfTip';
import { InstallPrompt } from './InstallPrompt';
import { applyShelfFilter, type ShelfFilter } from '../lib/shelf-filters';
import { summarizeStatuses } from '../lib/sort-items';
import { useCosmetics } from '../hooks/useCosmetics';
import { useDesignStyle } from '@/components/theme/style-provider';
import { cn } from '@/lib/utils';
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
  const [shelfFilter, setShelfFilter] = useState<ShelfFilter>('all');
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

  const filteredItems = useMemo(
    () => applyShelfFilter(items, shelfFilter),
    [items, shelfFilter],
  );

  const { designStyle } = useDesignStyle();
  const isWarmStyle = designStyle === 'warm';

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
    : isWarmStyle
      ? 'bottom-[calc(6.25rem+var(--safe-bottom))]'
      : 'bottom-[calc(4.5rem+var(--safe-bottom))]';

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
    <div
      className={cn(
        'mx-auto flex h-dvh w-full max-w-lg flex-col overflow-hidden',
        isWarmStyle ? 'bg-[var(--hero-overscroll)]' : 'bg-bg',
      )}
    >
      <PageHero summary={summaryLine} compact={items.length > 0} />

      <main
        ref={mainRef}
        className={cn(
          'content-enter relative flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-y-none px-4',
          designStyle === 'warm' &&
            cn(
              'shelf-sheet z-10 rounded-t-[var(--radius-sheet)] bg-surface pb-[calc(5.25rem+var(--safe-bottom))]',
              items.length === 0 ? '-mt-12 pt-5' : '-mt-5 pt-5',
            ),
          designStyle === 'pulse' &&
            'z-10 bg-bg pb-[calc(4.75rem+var(--safe-bottom))] pt-4',
          designStyle === 'riot' &&
            'riot-shelf z-10 bg-bg pb-[calc(4.5rem+var(--safe-bottom))] pt-3',
        )}
      >
        {items.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <ShelfTip />
            <div className="mt-2 flex flex-col gap-3">
              <ShelfFilters value={shelfFilter} onChange={setShelfFilter} />
              {filteredItems.length > 0 ? (
                <CosmeticsDashboard
                  items={filteredItems}
                  onRemove={handleRemove}
                  onEdit={openEditModal}
                />
              ) : (
                <p className="rounded-card border border-border/70 bg-bg/80 px-4 py-9 text-center text-sm text-muted">
                  Нет продуктов по этому фильтру
                </p>
              )}
            </div>
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
        />
      )}

      {isProfileOpen && (
        <ProfileSheet
          onClose={() => {
            setIsProfileOpen(false);
            setActiveTab('shelf');
          }}
          isOnline={isOnline}
          error={error}
          syncStatus={syncStatus}
          syncError={syncError}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
          isSignedIn={isSignedIn}
          onRetrySync={retrySync}
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
          <div className="mx-auto flex max-w-lg items-center justify-between gap-3 rounded-[16px] bg-[#2c2420] px-4 py-3 text-sm text-white">
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
