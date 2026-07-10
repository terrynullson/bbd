import type { CosmeticItem } from '../types';

export type ShelfFilter = 'all' | 'fresh' | 'expiring' | 'expired' | 'sealed';

export type ShelfCounts = Record<ShelfFilter, number>;

export function applyShelfFilter(
  items: CosmeticItem[],
  filter: ShelfFilter,
): CosmeticItem[] {
  switch (filter) {
    case 'fresh':
      return items.filter((item) => item.status === 'fresh');
    case 'expiring':
      return items.filter((item) => item.status === 'expiring');
    case 'expired':
      return items.filter((item) => item.status === 'expired');
    case 'sealed':
      return items.filter((item) => item.isSealed === true);
    case 'all':
    default:
      return items;
  }
}

export function countShelfFilters(items: CosmeticItem[]): ShelfCounts {
  return {
    all: items.length,
    fresh: items.filter((item) => item.status === 'fresh').length,
    expiring: items.filter((item) => item.status === 'expiring').length,
    expired: items.filter((item) => item.status === 'expired').length,
    sealed: items.filter((item) => item.isSealed === true).length,
  };
}
