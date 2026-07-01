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

  return (
    <div className="mx-auto min-h-dvh w-full max-w-lg bg-bg">
      <PageHero summary={summaryLine} />

      <main
        className={`relative z-10 -mt-5 rounded-t-[28px] bg-surface px-4 pt-6 shadow-[0_-8px_32px_rgba(44,36,32,0.06)] ${bottomPad}`}
      >
        {items.length === 0 ? (
          <EmptyState onAdd={() => setIsModalOpen(true)} />
        ) : (
          <CosmeticsDashboard items={items} onRemove={removeItem} />
        )}

        <p className="mt-6 pb-2 text-center text-[10px] uppercase tracking-[0.2em] text-muted/60">
          v{APP_VERSION}
        </p>
      </main>

      {items.length > 0 && (
        <div className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-border/50 bg-surface/90 px-4 pt-3 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-lg">
            <Button
              size="lg"
              className="h-12 w-full rounded-[14px] text-[15px]"
              onClick={() => setIsModalOpen(true)}
            >
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
