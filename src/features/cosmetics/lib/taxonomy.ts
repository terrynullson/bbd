import type { CosmeticItem, ProductCategory, ProductGroup, ProductSubtype } from '../types';

const SUBTYPE_LABELS: Record<ProductSubtype, string> = {
  day_cream: 'Дневной крем',
  night_cream: 'Ночной крем',
  serum: 'Сыворотка',
  toner: 'Тоник',
  cleanser: 'Очищение',
  mask: 'Маска',
  lipstick: 'Помада',
  foundation: 'Тональный крем',
  shampoo: 'Шампунь',
  conditioner: 'Кондиционер',
  body_lotion: 'Лосьон для тела',
  perfume: 'Парфюм',
  nail_polish: 'Лак для ногтей',
  other: 'Другое',
};

export function inferTaxonomy(
  category: ProductCategory = 'other',
  text = '',
): { group: ProductGroup; subtype: ProductSubtype; label: string } {
  const lower = text.toLowerCase();
  let group: ProductGroup = 'other';
  let subtype: ProductSubtype = 'other';

  switch (category) {
    case 'cream':
      group = 'skincare';
      subtype = /ночн|night/i.test(lower) ? 'night_cream' : 'day_cream';
      break;
    case 'serum':
      group = 'skincare';
      subtype = 'serum';
      break;
    case 'toner':
      group = 'skincare';
      subtype = 'toner';
      break;
    case 'cleanser':
      group = 'skincare';
      subtype = 'cleanser';
      break;
    case 'mask':
      group = 'skincare';
      subtype = 'mask';
      break;
    default:
      if (/помад|lipstick|lip\s*stick/i.test(lower)) {
        group = 'makeup';
        subtype = 'lipstick';
      } else if (/тональн|foundation|bb\s*крем/i.test(lower)) {
        group = 'makeup';
        subtype = 'foundation';
      } else if (/шампун|shampoo/i.test(lower)) {
        group = 'hair';
        subtype = 'shampoo';
      } else if (/кондицион|conditioner|бальзам.*волос/i.test(lower)) {
        group = 'hair';
        subtype = 'conditioner';
      } else if (/парфюм|духи|perfume|eau de/i.test(lower)) {
        group = 'fragrance';
        subtype = 'perfume';
      } else if (/лак.*ногт|nail polish/i.test(lower)) {
        group = 'nails';
        subtype = 'nail_polish';
      } else if (/лосьон.*тел|body lotion|гель.*душ/i.test(lower)) {
        group = 'body';
        subtype = 'body_lotion';
      }
      break;
  }

  return { group, subtype, label: SUBTYPE_LABELS[subtype] };
}

export function getSubtypeLabel(item: CosmeticItem): string {
  if (item.productSubtype) {
    return SUBTYPE_LABELS[item.productSubtype];
  }
  return inferTaxonomy(item.category, `${item.brand} ${item.name}`).label;
}
