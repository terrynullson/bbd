import { STORAGE_KEY } from '@/lib/constants';
import { calculateStatus } from './calculate-status';
import type { CosmeticItem } from '../types';

export function readCosmetics(): CosmeticItem[] {
  if (typeof window === 'undefined') return [];

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as CosmeticItem[];
    return parsed.map((item) => ({
      ...item,
      status: calculateStatus(item.openedAt, item.paoMonths),
    }));
  } catch {
    return [];
  }
}

export function writeCosmetics(items: CosmeticItem[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}
