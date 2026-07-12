'use client';

import { useCallback, useMemo, useState } from 'react';
import { NOTIFS_SEEN_KEY } from '@/lib/constants';
import { buildReminders, countUnseen } from '../lib/reminders';
import type { CosmeticItem } from '../types';

function readSeen(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(NOTIFS_SEEN_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** Напоминания из сроков + бейдж непоказанного (seen хранится локально). */
export function useReminders(items: CosmeticItem[]) {
  const [seen, setSeen] = useState<string[]>(readSeen);

  const reminders = useMemo(() => buildReminders(items), [items]);
  const unseenCount = useMemo(
    () => countUnseen(reminders, seen),
    [reminders, seen],
  );

  const markAllSeen = useCallback(() => {
    // Помним только актуальные id — старые (для удалённых/заменённых) отсекаем.
    const ids = buildReminders(items).map((r) => r.id);
    setSeen(ids);
    try {
      localStorage.setItem(NOTIFS_SEEN_KEY, JSON.stringify(ids));
    } catch {
      // запись недоступна — бейдж просто вернётся при перезагрузке
    }
  }, [items]);

  return { reminders, unseenCount, markAllSeen };
}
