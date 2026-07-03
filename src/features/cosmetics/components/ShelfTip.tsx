'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SHELF_TIP_DISMISS_KEY } from '@/lib/constants';

export function ShelfTip() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setVisible(localStorage.getItem(SHELF_TIP_DISMISS_KEY) !== '1');
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(SHELF_TIP_DISMISS_KEY, '1');
    setVisible(false);
  };

  return (
    <div className="mb-3 rounded-[14px] border border-accent/20 bg-accent/5 px-4 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs leading-relaxed text-muted">
          BBD удобнее всего для средств, которыми вы уже пользуетесь. Запас
          можно добавить с датой «Годен до» с упаковки — PAO начнётся после
          вскрытия.
        </p>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Скрыть подсказку"
          className="shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-surface hover:text-text"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
