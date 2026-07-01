'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { Button } from '@/components/ui/Button';
import { AddProductModal } from './AddProductModal';
import { CosmeticsDashboard } from './CosmeticsDashboard';
import { EmptyState } from './EmptyState';
import { InstallPrompt } from './InstallPrompt';
import { UpdateNotice } from './UpdateNotice';
import { summarizeStatuses } from '../lib/sort-items';
import { useCosmetics } from '../hooks/useCosmetics';
import { APP_VERSION } from '@/lib/constants';

export function CosmeticsPage() {
  const { items, addItem, removeItem, isLoaded } = useCosmetics();
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg text-muted">
        Загрузка...
      </div>
    );
  }

  const summary = summarizeStatuses(items);

  return (
    <div className="min-h-screen bg-bg pb-28 text-text">
      <header className="sticky top-0 z-10 border-b border-border/70 bg-bg/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-lg items-start justify-between gap-4 px-5 pb-4 pt-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">
              Beauty shelf
            </p>
            <h1 className="font-display mt-1 text-3xl font-semibold tracking-tight">
              Где мой крем
            </h1>
            {items.length > 0 && (
              <p className="mt-2 text-sm text-muted">
                {summary.fresh} свежих · {summary.expiring} истекают ·{' '}
                {summary.expired} просрочено
              </p>
            )}
            <p className="mt-1 text-[10px] uppercase tracking-widest text-muted/60">
              v{APP_VERSION}
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-lg px-5 pt-6">
        <UpdateNotice />
        {items.length === 0 ? (
          <EmptyState onAdd={() => setIsModalOpen(true)} />
        ) : (
          <CosmeticsDashboard items={items} onRemove={removeItem} />
        )}
      </main>

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-bg/95 p-4 backdrop-blur-md">
          <div className="mx-auto max-w-lg">
            <Button size="lg" className="w-full" onClick={() => setIsModalOpen(true)}>
              <Plus className="h-5 w-5" />
              Добавить продукт
            </Button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <AddProductModal
          onClose={() => setIsModalOpen(false)}
          onSubmit={addItem}
        />
      )}

      <InstallPrompt />
    </div>
  );
}
