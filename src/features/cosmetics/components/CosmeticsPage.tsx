'use client';

import { Plus } from 'lucide-react';
import { useState } from 'react';
import { PageHero } from '@/components/layout/PageHero';
import { Button } from '@/components/ui/Button';
import { AddProductModal } from './AddProductModal';
import { CosmeticsDashboard } from './CosmeticsDashboard';
import { EmptyState } from './EmptyState';
import { InstallPrompt } from './InstallPrompt';
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
  const summaryLine =
    items.length > 0
      ? `${summary.fresh} свежих · ${summary.expiring} истекают · ${summary.expired} просрочено`
      : null;

  return (
    <div className="mx-auto min-h-screen max-w-lg bg-bg pb-32">
      <PageHero summary={summaryLine} />

      <main className="space-y-4 px-4 pt-5">
        {items.length === 0 ? (
          <EmptyState onAdd={() => setIsModalOpen(true)} />
        ) : (
          <CosmeticsDashboard items={items} onRemove={removeItem} />
        )}

        <p className="pt-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted/70">
          v{APP_VERSION}
        </p>
      </main>

      {items.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border/60 bg-bg/80 p-4 backdrop-blur-xl">
          <div className="mx-auto max-w-lg">
            <Button size="lg" className="w-full rounded-[14px]" onClick={() => setIsModalOpen(true)}>
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
