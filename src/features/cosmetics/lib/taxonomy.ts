import type {
  CosmeticItem,
  ProductCategory,
  ProductGroup,
  ProductSubtype,
} from '../types';

/* ── Категории ───────────────────────────────────────────
 * 11 осмысленных + «Другое». Slug'и cream/serum/toner/cleanser/mask
 * оставлены прежними ради совместимости с Supabase и выводами ИИ.
 */

export const CATEGORY_LABELS: Record<ProductCategory, string> = {
  cleanser: 'Очищение',
  toner: 'Тонизирование',
  serum: 'Сыворотки и уход',
  cream: 'Увлажнение',
  mask: 'Маски',
  suncare: 'Защита от солнца',
  makeup: 'Макияж',
  hair: 'Волосы',
  body: 'Тело и руки',
  fragrance: 'Парфюм',
  nails: 'Ногти',
  other: 'Другое',
};

export const CATEGORY_ORDER: ProductCategory[] = [
  'cleanser',
  'toner',
  'serum',
  'cream',
  'mask',
  'suncare',
  'makeup',
  'hair',
  'body',
  'fragrance',
  'nails',
  'other',
];

/** Категория → макро-секция полки. */
const CATEGORY_GROUP: Record<ProductCategory, ProductGroup> = {
  cleanser: 'skincare',
  toner: 'skincare',
  serum: 'skincare',
  cream: 'skincare',
  mask: 'skincare',
  suncare: 'skincare',
  makeup: 'makeup',
  hair: 'hair',
  body: 'body',
  fragrance: 'fragrance',
  nails: 'nails',
  other: 'other',
};

/** Приводит любое (старое каталожное, старое пользовательское, чужое) значение к канону. */
export function normalizeCategory(value?: string | null): ProductCategory {
  if (value && value in CATEGORY_LABELS) return value as ProductCategory;
  return 'other';
}

export function getCategoryLabel(category: ProductCategory = 'other'): string {
  return CATEGORY_LABELS[category];
}

/* ── Секции полки ──────────────────────────────────────── */

export const GROUP_LABELS: Record<ProductGroup, string> = {
  skincare: 'Уход за кожей',
  makeup: 'Макияж',
  hair: 'Волосы',
  body: 'Тело и руки',
  fragrance: 'Ароматы',
  nails: 'Ногти',
  mens: 'Мужское',
  baby: 'Детское',
  derm: 'Дерматология',
  other: 'Прочее',
};

export const GROUP_ORDER: ProductGroup[] = [
  'skincare',
  'makeup',
  'hair',
  'body',
  'nails',
  'fragrance',
  'mens',
  'baby',
  'derm',
  'other',
];

/* ── Подтипы: точность PAO и подписи ─────────────────────
 * Подтип нужен там, где срок отличается от категорийного дефолта
 * (тушь 6, парфюм 24) или где нужна конкретная подпись/иконка.
 */

const SUBTYPE_LABELS: Record<ProductSubtype, string> = {
  day_cream: 'Дневной крем',
  night_cream: 'Ночной крем',
  serum: 'Сыворотка',
  toner: 'Тоник',
  cleanser: 'Очищение',
  mask: 'Маска',
  sunscreen: 'Санскрин',
  lipstick: 'Помада',
  foundation: 'Тональный крем',
  mascara: 'Тушь',
  shampoo: 'Шампунь',
  conditioner: 'Кондиционер',
  body_lotion: 'Лосьон для тела',
  hand_cream: 'Крем для рук',
  deodorant: 'Дезодорант',
  perfume: 'Парфюм',
  nail_polish: 'Лак для ногтей',
  other: 'Другое',
};

const DEFAULT_PAO_MONTHS: Record<ProductSubtype, number> = {
  day_cream: 12,
  night_cream: 12,
  serum: 6,
  toner: 12,
  cleanser: 12,
  mask: 6,
  sunscreen: 12,
  lipstick: 12,
  foundation: 12,
  mascara: 3,
  shampoo: 12,
  conditioner: 12,
  body_lotion: 12,
  hand_cream: 12,
  deodorant: 12,
  perfume: 24,
  nail_polish: 24,
  other: 12,
};

/** Категорийный дефолт PAO — когда подтип не уточнён. */
const CATEGORY_PAO_MONTHS: Record<ProductCategory, number> = {
  cleanser: 12,
  toner: 12,
  serum: 6,
  cream: 12,
  mask: 6,
  suncare: 12,
  makeup: 12,
  hair: 12,
  body: 12,
  fragrance: 24,
  nails: 24,
  other: 12,
};

type Taxonomy = {
  group: ProductGroup;
  subtype: ProductSubtype;
  label: string;
};

/** Уточняет подтип по тексту внутри категории (для PAO и подписи). */
function inferSubtype(category: ProductCategory, lower: string): ProductSubtype {
  switch (category) {
    case 'cream':
      return /ночн|night/i.test(lower) ? 'night_cream' : 'day_cream';
    case 'serum':
      return 'serum';
    case 'toner':
      return 'toner';
    case 'cleanser':
      return 'cleanser';
    case 'mask':
      return 'mask';
    case 'suncare':
      return 'sunscreen';
    case 'makeup':
      if (/тушь|mascara/i.test(lower)) return 'mascara';
      if (/помад|lipstick|lip\s*stick|блеск.*губ/i.test(lower)) return 'lipstick';
      if (/тональн|foundation|bb\s*крем|cc\s*крем|консилер/i.test(lower))
        return 'foundation';
      return 'other';
    case 'hair':
      if (/кондицион|conditioner|бальзам.*волос/i.test(lower)) return 'conditioner';
      if (/шампун|shampoo/i.test(lower)) return 'shampoo';
      return 'other';
    case 'body':
      if (/дезодор|антиперспир|deodorant/i.test(lower)) return 'deodorant';
      if (/крем.*рук|рук.*крем|hand\s*cream/i.test(lower)) return 'hand_cream';
      return 'body_lotion';
    case 'fragrance':
      return 'perfume';
    case 'nails':
      return 'nail_polish';
    default:
      return 'other';
  }
}

export function inferTaxonomy(
  category: ProductCategory = 'other',
  text = '',
): Taxonomy {
  const cat = normalizeCategory(category);
  const lower = text.toLowerCase();
  const subtype = inferSubtype(cat, lower);

  return {
    group: CATEGORY_GROUP[cat],
    subtype,
    label:
      subtype === 'other' ? CATEGORY_LABELS[cat] : SUBTYPE_LABELS[subtype],
  };
}

/** Подпись подтипа для карточки; для общего подтипа — ярлык категории. */
export function getSubtypeLabel(item: CosmeticItem): string {
  if (item.productSubtype && item.productSubtype !== 'other') {
    return SUBTYPE_LABELS[item.productSubtype];
  }
  return getCategoryLabel(normalizeCategory(item.category));
}

export function getSubtypePackagingLabel(subtype: ProductSubtype): string {
  return SUBTYPE_LABELS[subtype];
}

/** PAO по подтипу, если известен, иначе по категории. */
export function getDefaultPaoMonths(
  subtype: ProductSubtype,
  category?: ProductCategory,
): number {
  if (subtype !== 'other') return DEFAULT_PAO_MONTHS[subtype];
  return CATEGORY_PAO_MONTHS[normalizeCategory(category)];
}
