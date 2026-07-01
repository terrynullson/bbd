import type { ProductCategory } from '../types';

const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cream: 'Крем',
  serum: 'Сыворотка',
  toner: 'Тоник',
  cleanser: 'Очищение',
  mask: 'Маска',
  other: 'Уход',
};

export function getCategoryLabel(category: ProductCategory = 'other'): string {
  return CATEGORY_LABELS[category];
}

export function inferCategoryFromText(text: string): ProductCategory {
  const lower = text.toLowerCase();

  if (/сыворотк|serum|ампул/.test(lower)) return 'serum';
  if (/тоник|toner|эссенц/.test(lower)) return 'toner';
  if (/пенк|гель.*умыв|cleanser|мицелляр/.test(lower)) return 'cleanser';
  if (/маск|mask|патч/.test(lower)) return 'mask';
  if (/крем|лосьон|cream|moistur/.test(lower)) return 'cream';

  return 'other';
}
