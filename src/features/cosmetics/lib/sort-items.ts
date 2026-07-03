import { STATUS_ORDER } from '@/lib/constants';
import { getDaysRemaining } from './calculate-status';
import type { CosmeticItem } from '../types';

const SEALED_SORT_DAYS = Number.MAX_SAFE_INTEGER;

export function sortCosmeticItems(items: CosmeticItem[]): CosmeticItem[] {
  return [...items].sort((a, b) => {
    const daysA = (a.isSealed ?? false)
      ? SEALED_SORT_DAYS
      : getDaysRemaining(a.openedAt, a.paoMonths, a.isSealed);
    const daysB = (b.isSealed ?? false)
      ? SEALED_SORT_DAYS
      : getDaysRemaining(b.openedAt, b.paoMonths, b.isSealed);

    if (daysA !== daysB) return daysA - daysB;
    return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  });
}

export function summarizeStatuses(items: CosmeticItem[]) {
  return items.reduce(
    (acc, item) => {
      acc[item.status] += 1;
      return acc;
    },
    { fresh: 0, expiring: 0, expired: 0 },
  );
}
