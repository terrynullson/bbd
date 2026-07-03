import { sortCosmeticItems } from './sort-items';
import { GROUP_LABELS, GROUP_ORDER, inferTaxonomy } from './taxonomy';
import type { CosmeticItem, ProductGroup } from '../types';

export type ShelfSection = {
  id: string;
  title: string;
  items: CosmeticItem[];
};

function getProductGroup(item: CosmeticItem): ProductGroup {
  return item.productGroup ?? inferTaxonomy(
    item.category,
    `${item.brand} ${item.name}`,
  ).group;
}

function isUrgent(item: CosmeticItem) {
  return item.status === 'expiring' || item.status === 'expired';
}

export function buildShelfSections(items: CosmeticItem[]): ShelfSection[] {
  const urgentItems = items.filter(isUrgent);
  const reserveItems = items.filter((item) => !isUrgent(item) && item.isSealed);
  const activeItems = items.filter((item) => !isUrgent(item) && !item.isSealed);

  const sections: ShelfSection[] = [];

  if (urgentItems.length > 0) {
    sections.push({
      id: 'urgent',
      title: 'Скоро истекает',
      items: sortCosmeticItems(urgentItems),
    });
  }

  for (const group of GROUP_ORDER) {
    const groupItems = activeItems.filter((item) => getProductGroup(item) === group);
    if (groupItems.length === 0) continue;

    sections.push({
      id: group,
      title: GROUP_LABELS[group],
      items: sortCosmeticItems(groupItems),
    });
  }

  if (reserveItems.length > 0) {
    sections.push({
      id: 'reserve',
      title: 'Запас',
      items: sortCosmeticItems(reserveItems),
    });
  }

  return sections;
}
