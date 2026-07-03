import type { CosmeticItem } from '../types';

export type ShelfFilter = 'all' | 'expiring' | 'expired' | 'sealed';

export function applyShelfFilter(
  items: CosmeticItem[],
  filter: ShelfFilter,
): CosmeticItem[] {
  switch (filter) {
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
