'use client';

import { useMemo } from 'react';
import { buildReminders } from '../lib/reminders';
import type { CosmeticItem } from '../types';

/** Напоминания из сроков + их текущее число для бейджа на колокольчике. */
export function useReminders(items: CosmeticItem[]) {
  const reminders = useMemo(() => buildReminders(items), [items]);
  return { reminders, count: reminders.length };
}
