'use client';

import { useState } from 'react';
import { APP_VERSION } from '@/lib/constants';
import { Button } from '@/components/ui/Button';

const VERSION_STORAGE_KEY = 'gde-moy-krem-app-version';

function shouldShowUpdateNotice(): boolean {
  if (typeof window === 'undefined') return false;
  const stored = localStorage.getItem(VERSION_STORAGE_KEY);
  return !stored || stored !== APP_VERSION;
}

export function UpdateNotice() {
  const [visible, setVisible] = useState(shouldShowUpdateNotice);

  if (typeof window !== 'undefined') {
    localStorage.setItem(VERSION_STORAGE_KEY, APP_VERSION);
  }

  if (!visible) return null;

  return (
    <div className="mx-auto mb-4 max-w-lg rounded-card border border-accent/20 bg-accent/10 px-4 py-3">
      <p className="text-sm font-medium text-text">Доступна новая версия интерфейса</p>
      <p className="mt-1 text-xs text-muted">
        Если видите старый розовый дизайн, обновите страницу. На iPhone: удалите
        ярлык с экрана «Домой» и добавьте сайт заново из Safari.
      </p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-3"
        onClick={() => {
          setVisible(false);
          window.location.reload();
        }}
      >
        Обновить сейчас
      </Button>
    </div>
  );
}
