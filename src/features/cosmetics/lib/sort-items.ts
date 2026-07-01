import { STATUS_ORDER } from '@/lib/constants';
import type { CosmeticItem } from '../types';

export function sortCosmeticItems(items: CosmeticItem[]): CosmeticItem[] {
  return [...items].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
  );
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
