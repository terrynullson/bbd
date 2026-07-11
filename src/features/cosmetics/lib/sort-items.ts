import { STATUS_ORDER } from '@/lib/constants';
import { getDaysRemaining } from './calculate-status';
import { expiryParamsFromItem } from './expiry';
import type { CosmeticItem } from '../types';

export function sortCosmeticItems(items: CosmeticItem[]): CosmeticItem[] {
  return [...items].sort((a, b) => {
    const daysA = getDaysRemaining(expiryParamsFromItem(a));
    const daysB = getDaysRemaining(expiryParamsFromItem(b));

    if (daysA !== daysB) return daysA - daysB;
    return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  });
}
