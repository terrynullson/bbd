import type { ProductCategory } from '../types';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cream: 'CREAM',
  serum: 'SERUM',
  toner: 'TONER',
  cleanser: 'CLEANSER',
  mask: 'MASK',
  other: 'OTHER',
};

export function getCategoryLabel(category: ProductCategory = 'other'): string {
  return CATEGORY_LABELS[category];
}

export function inferCategoryFromText(text: string): ProductCategory {
  const lower = text.toLowerCase();

  if (/сыворотк|serum|ампул|niacinamide/i.test(lower)) return 'serum';
  if (/тоник|toner|эссенц/i.test(lower)) return 'toner';
  if (/пенк|гель.*умыв|cleanser|мицелляр/i.test(lower)) return 'cleanser';
  if (/маск|mask|патч/i.test(lower)) return 'mask';
  if (/крем|лосьон|cream|moistur/i.test(lower)) return 'cream';

  return 'other';
}
