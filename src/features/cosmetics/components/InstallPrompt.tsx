'use client';

import { Share, X } from 'lucide-react';
import { useState } from 'react';
import { INSTALL_DISMISS_KEY } from '@/lib/constants';
import { Button } from '@/components/ui/Button';

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
    <div className="fixed inset-x-0 bottom-0 z-30 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-lg rounded-card border border-border bg-surface p-4 shadow-[var(--shadow-modal)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-display text-base font-semibold text-text">
              Добавить на экран «Домой»
            </p>
            <p className="mt-1 text-sm text-muted">
              Откройте как приложение без адресной строки Safari.
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={dismiss}
            aria-label="Закрыть подсказку"
            className="h-8 w-8 shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <ol className="space-y-2 text-sm text-muted">
          <li className="flex items-center gap-2">
            <Share className="h-4 w-4 shrink-0 text-accent" />
            Нажмите «Поделиться» внизу Safari
          </li>
          <li>Выберите «На экран Домой»</li>
          <li>Подтвердите добавление</li>
        </ol>

        <Button variant="secondary" className="mt-4 w-full" onClick={dismiss}>
          Понятно
        </Button>
      </div>
    </div>
  );
}
