'use client';

import { Modal } from '@/components/ui/Modal';
import { AuthPanel } from '@/components/auth/AuthPanel';
import { ThemeToggle } from '@/components/theme/theme-toggle';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import { useAuth } from '@/lib/supabase/use-auth';
import { haptic } from '@/lib/haptics';
import {
  getStorageStatusMessage,
  shouldShowSyncRetry,
} from '../lib/storage-status';
import type { CosmeticItem } from '../types';

type ProfileSheetProps = {
  onClose: () => void;
  items: CosmeticItem[];
  isOnline: boolean;
  error: string;
  syncStatus: 'local' | 'syncing' | 'synced' | 'offline' | 'error';
  syncError: string;
  isSaving: boolean;
  lastSavedAt: string | null;
  isSignedIn: boolean;
  onRetrySync: () => void;
};

function initialsFrom(name: string): string {
  return name
    .trim()
    .split(/[\s._-]+/)
    .map((word) => word[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/** «На полке с марта 2026» — по самому раннему добавленному средству. */
function memberSince(items: CosmeticItem[]): string | null {
  const earliest = items
    .map((item) => item.createdAt)
    .filter(Boolean)
    .sort()[0];
  if (!earliest) return null;

  // С днём месяц встаёт в родительный падеж («июля», а не «июль») — день затем отбрасываем.
  const label = new Date(earliest)
    .toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    .replace(/^\d+\s+/, '')
    .replace(/\s*г\.$/, '');

  return `На полке с ${label}`;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function Row({
  label,
  children,
  last = false,
}: {
  label: string;
  children: React.ReactNode;
  last?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between gap-4 py-[15px] ${
        last ? '' : 'border-b border-icon-bg'
      }`}
    >
      <span className="text-sm text-text">{label}</span>
      {children}
    </div>
  );
}

function StatTile({
  value,
  label,
  color,
}: {
  value: number;
  label: string;
  color?: string;
}) {
  return (
    <div className="rounded-[18px] border border-border bg-surface px-1.5 py-4 text-center">
      <p className="text-[26px] font-light leading-none" style={{ color }}>
        {value}
      </p>
      <p className="mt-1 text-[11.5px] text-muted">{label}</p>
    </div>
  );
}

export function ProfileSheet({
  onClose,
  items,
  isOnline,
  error,
  syncStatus,
  syncError,
  isSaving,
  lastSavedAt,
  isSignedIn,
  onRetrySync,
}: ProfileSheetProps) {
  const { user } = useAuth();
  // Лист открывается только по клику, поэтому на сервере не рендерится.
  const installed = isStandalone();

  const storageStatus = getStorageStatusMessage({
    isOnline,
    error,
    syncStatus,
    syncError,
    isSignedIn,
    isSaving,
    lastSavedAt,
  });
  const showSyncRetry = shouldShowSyncRetry(syncError, isOnline, isSignedIn);

  const displayName = user?.email ? user.email.split('@')[0] : 'Гость';
  const since = memberSince(items);

  const fresh = items.filter((item) => item.status === 'fresh').length;
  const attention = items.filter((item) => item.status !== 'fresh').length;

  const exportData = () => {
    haptic('light');
    const blob = new Blob([JSON.stringify({ items }, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bbd-shelf-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal title="" onClose={onClose}>
      <div className="mb-6 flex items-center gap-4">
        <div
          className="flex h-[60px] w-[60px] shrink-0 items-center justify-center rounded-full text-xl font-semibold"
          style={{ background: 'var(--nav-pill)', color: 'var(--accent)' }}
          aria-hidden
        >
          {initialsFrom(displayName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-[21px] font-medium text-text">
            {displayName}
          </p>
          <p className="mt-0.5 truncate text-[13px] text-muted">
            {since ?? 'Полка пока пуста'}
          </p>
        </div>
      </div>

      <div className="mb-[22px] grid grid-cols-3 gap-2.5">
        <StatTile value={items.length} label="всего" />
        <StatTile value={fresh} label="свежих" color="var(--fresh)" />
        <StatTile value={attention} label="внимание" color="var(--expired)" />
      </div>

      <div className="rounded-card border border-border bg-surface px-5 py-2">
        <Row label="Офлайн-режим">
          <span
            className="rounded-full px-3 py-[5px] text-xs font-bold"
            style={
              isOnline
                ? { background: 'var(--icon-bg)', color: 'var(--muted)' }
                : {
                    background: 'color-mix(in srgb, var(--fresh) 18%, var(--surface))',
                    color: 'var(--fresh)',
                  }
            }
          >
            {isOnline ? 'наготове' : 'активен'}
          </span>
        </Row>

        <Row label="Установить на экран">
          <span
            className="text-[13px] font-semibold"
            style={{ color: installed ? 'var(--muted)' : 'var(--quiet-gold-deep)' }}
          >
            {installed ? 'установлено' : 'PWA →'}
          </span>
        </Row>

        <Row label="Тема оформления">
          <ThemeToggle />
        </Row>

        <div className="py-[3px]">
          <button
            type="button"
            onClick={exportData}
            disabled={items.length === 0}
            className="flex min-h-11 w-full items-center justify-between gap-4 text-sm text-text disabled:opacity-40"
          >
            <span>Экспорт данных</span>
            <span aria-hidden style={{ color: 'var(--chevron)' }}>
              ›
            </span>
          </button>
        </div>
      </div>

      <div className="mt-3 rounded-card border border-border bg-surface px-5 py-4">
        <AuthPanel />
      </div>

      <p
        className={`mt-5 text-center text-xs ${
          error || syncError ? 'text-expired' : 'text-muted/70'
        }`}
      >
        {storageStatus}
        {showSyncRetry && (
          <>
            {' · '}
            <button
              type="button"
              onClick={onRetrySync}
              className="font-semibold text-text underline underline-offset-2"
            >
              Повторить
            </button>
          </>
        )}
      </p>

      <p className="quiet-label mt-2.5 text-center">
        {APP_NAME} · v{APP_VERSION} · BBD
      </p>
    </Modal>
  );
}
