export function normalizeSearchText(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function isUsefulCatalogValue(value?: string) {
  if (!value) return false;
  const normalized = normalizeSearchText(value);
  return Boolean(normalized && normalized !== 'неизвестный бренд');
}
