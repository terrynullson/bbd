import type { AnalyzeProductRequest, AnalyzeProductResponse } from '../types';

const UNKNOWN_BRAND = 'Неизвестный бренд';

function isMeaningful(value: string | undefined): value is string {
  return Boolean(value?.trim());
}

function isUnknownBrand(value: string | undefined): boolean {
  return !value?.trim() || value.trim() === UNKNOWN_BRAND;
}

export function buildAnalyzeQuery(input: AnalyzeProductRequest): string {
  const parts = [input.brand, input.name, input.query]
    .map((part) => part?.trim())
    .filter(Boolean);

  return [...new Set(parts)].join(' — ');
}

export function mergeAnalyzeResult(
  current: AnalyzeProductRequest,
  ai: AnalyzeProductResponse,
): AnalyzeProductResponse {
  const currentBrand = current.brand?.trim() ?? '';
  const currentName = current.name?.trim() ?? '';
  const aiBrand = ai.brand?.trim() ?? '';
  const aiName = ai.name?.trim() ?? '';

  let brand = currentBrand;
  if (!isMeaningful(currentBrand)) {
    brand = isUnknownBrand(aiBrand) ? UNKNOWN_BRAND : aiBrand;
  } else if (isMeaningful(aiBrand) && !isUnknownBrand(aiBrand)) {
    brand = aiBrand;
  }

  let name = currentName;
  if (!isMeaningful(currentName)) {
    name = aiName || current.query?.trim() || '';
  } else if (isMeaningful(aiName) && aiName.length > currentName.length) {
    name = aiName;
  }

  return {
    brand,
    name,
    paoMonths: ai.paoMonths,
    category: ai.category,
  };
}
