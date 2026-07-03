import { normalizeSearchText } from './normalize';
import type { AddProductInput, BarcodeSource, BarcodeTrust } from '../types';

const NON_COSMETIC_PATTERNS = [
  /\bbanana/i,
  /\bfood\b/i,
  /\bgrocery/i,
  /\bfruit/i,
  /\bvegetable/i,
  /\bmilk\b/i,
  /\bbread\b/i,
  /\bmeat\b/i,
  /\bbeverage/i,
  /\bdrink\b/i,
  /en:fruits/,
  /en:plant-based-foods/,
  /en:groceries/,
  /en:snacks/,
  /en:beverages/,
];

const COSMETIC_HINTS =
  /beauty|cosmetic|skincare|makeup|cream|serum|perfume|shampoo|lotion|en:face|en:hair|en:body|en:make-up/;

export function isLikelyCosmetic(
  text: string,
  categoriesTags?: string[],
): boolean {
  const combined = [text, ...(categoriesTags ?? [])].join(' ').toLowerCase();

  if (NON_COSMETIC_PATTERNS.some((pattern) => pattern.test(combined))) {
    return false;
  }

  if (categoriesTags?.length) {
    return COSMETIC_HINTS.test(combined);
  }

  return true;
}

export function namesMatchForBarcode(
  savedName: string,
  lookupName: string,
): boolean {
  const tokensA = new Set(
    normalizeSearchText(savedName)
      .split(' ')
      .filter((token) => token.length > 2),
  );
  const tokensB = new Set(
    normalizeSearchText(lookupName)
      .split(' ')
      .filter((token) => token.length > 2),
  );

  if (tokensA.size === 0 || tokensB.size === 0) return true;

  let overlap = 0;
  for (const token of tokensA) {
    if (tokensB.has(token)) overlap += 1;
  }

  return overlap / Math.min(tokensA.size, tokensB.size) >= 0.3;
}

export type CatalogPayloadInput = {
  brand: string;
  name: string;
  barcode?: string;
  category?: AddProductInput['category'];
  paoMonths?: number;
  imageUrl?: string;
  source?: string;
  barcodeTrust?: BarcodeTrust;
  barcodeSource?: BarcodeSource;
};

export function buildCatalogPayload(
  input: AddProductInput,
  trust: BarcodeTrust,
  lookup?: { name?: string },
): CatalogPayloadInput {
  const includeBarcode =
    Boolean(input.barcode) &&
    trust !== 'suspicious' &&
    (!lookup?.name || !input.name || namesMatchForBarcode(input.name, lookup.name));

  return {
    brand: input.brand,
    name: input.name,
    barcode: includeBarcode ? input.barcode : undefined,
    category: input.category,
    paoMonths: input.paoMonths,
    imageUrl: input.imageUrl,
    source: input.lookupSource ?? (input.barcode ? 'barcode' : 'manual'),
    barcodeTrust: trust,
    barcodeSource: input.barcodeSource,
  };
}
