import type { CosmeticItem, ProductSubtype } from '../types';
import { inferTaxonomy } from './taxonomy';

const SUBTYPE_PACKAGING: Record<ProductSubtype, string> = {
  day_cream: 'jar',
  night_cream: 'jar',
  serum: 'dropper',
  toner: 'spray',
  cleanser: 'pump',
  mask: 'sachet',
  lipstick: 'lipstick',
  foundation: 'compact',
  shampoo: 'bottle',
  conditioner: 'bottle',
  body_lotion: 'pump',
  perfume: 'perfume',
  nail_polish: 'nail-polish',
  other: 'generic',
};

export type PackagingIconName =
  | 'jar'
  | 'tube'
  | 'dropper'
  | 'pump'
  | 'spray'
  | 'bottle'
  | 'lipstick'
  | 'compact'
  | 'perfume'
  | 'nail-polish'
  | 'sachet'
  | 'generic';

export function getPackagingIconName(item: CosmeticItem): PackagingIconName {
  const subtype =
    item.productSubtype ??
    inferTaxonomy(item.category, `${item.brand} ${item.name}`).subtype;
  return (SUBTYPE_PACKAGING[subtype] ?? 'generic') as PackagingIconName;
}
