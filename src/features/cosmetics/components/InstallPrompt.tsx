'use client';

import { Share, X } from 'lucide-react';
import { useState } from 'react';
import { INSTALL_DISMISS_KEY } from '@/lib/constants';

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    ('standalone' in navigator &&
      (navigator as Navigator & { standalone?: boolean }).standalone === true)
  );
}

function shouldShowInstallPrompt(): boolean {
  if (typeof window === 'undefined') return false;
  if (localStorage.getItem(INSTALL_DISMISS_KEY) === '1') return false;
  return isIos() && !isStandalone();
}

export function InstallPrompt() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || !shouldShowInstallPrompt()) return null;

  const dismiss = () => {
    localStorage.setItem(INSTALL_DISMISS_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="fixed inset-x-0 top-3 z-30 px-4 pt-[env(safe-area-inset-top)]">
      <div className="mx-auto flex max-w-lg items-center gap-3 rounded-[14px] border border-border bg-surface/95 px-3 py-2.5 shadow-[var(--shadow-card)] backdrop-blur-md">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
          <Share className="h-4 w-4" />
        </div>
        <p className="min-w-0 flex-1 text-xs leading-snug text-text">
          Добавить на экран «Домой»
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Закрыть"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-bg"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
