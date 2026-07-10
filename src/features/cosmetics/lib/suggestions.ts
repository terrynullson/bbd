import type { CosmeticItem, ProductSuggestion } from '../types';

const MAX_SUGGESTIONS = 8;

export function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

/** Локальные подсказки идут первыми, дубликаты «бренд + название» отбрасываются. */
export function mergeSuggestions(
  local: ProductSuggestion[],
  remote: ProductSuggestion[],
): ProductSuggestion[] {
  const seen = new Set<string>();

  return [...local, ...remote]
    .filter((suggestion) => {
      const key = normalizeQuery(`${suggestion.brand ?? ''} ${suggestion.name}`);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, MAX_SUGGESTIONS);
}

export function filterLocalBrands(
  items: CosmeticItem[],
  query: string,
): ProductSuggestion[] {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];

  return items
    .filter((item) => normalizeQuery(item.brand).includes(normalized))
    .map((item) => ({
      id: item.id,
      name: item.brand,
      source: 'local' as const,
    }));
}

export function filterLocalProducts(
  items: CosmeticItem[],
  query: string,
  brand?: string,
): ProductSuggestion[] {
  const normalized = normalizeQuery(query);
  if (!normalized) return [];
  const normalizedBrand = normalizeQuery(brand ?? '');

  return items
    .filter((item) => {
      const matchesName = normalizeQuery(item.name).includes(normalized);
      const matchesBrand =
        !normalizedBrand || normalizeQuery(item.brand).includes(normalizedBrand);
      return matchesName && matchesBrand;
    })
    .map((item) => ({
      id: item.id,
      brand: item.brand,
      name: item.name,
      barcode: item.barcode,
      paoMonths: item.paoMonths,
      category: item.category,
      imageUrl: item.imageUrl,
      source: 'local' as const,
    }));
}
