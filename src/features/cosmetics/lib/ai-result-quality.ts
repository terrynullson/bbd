import { isUnknownBrand } from './analyze-context';
import type { AnalyzeProductResponse } from '../types';

export const GENERIC_NAME_STOP_WORDS = [
  'крем',
  'маска',
  'сыворотка',
  'тоник',
  'умывалка',
  'пенка',
  'гель',
  'шампунь',
  'бальзам',
] as const;

const GENERIC_ADJECTIVES = new Set([
  'увлажняющий',
  'увлажняющая',
  'увлажняющее',
  'питательный',
  'питательная',
  'питательное',
  'очищающий',
  'очищающая',
  'очищающее',
  'для',
  'лица',
  'лицо',
  'тела',
  'тело',
  'волос',
  'глаз',
  'рук',
  'ног',
  'ночной',
  'ночная',
  'ночное',
  'дневной',
  'дневная',
  'дневное',
  'кожи',
  'кожа',
]);

function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/ё/g, 'е');
}

function tokenizeName(value: string) {
  return normalizeName(value)
    .split(/[\s,.–—\-/]+/)
    .filter((token) => token.length > 1);
}

function containsStopWord(name: string) {
  const normalized = normalizeName(name);
  const tokens = tokenizeName(name);

  return GENERIC_NAME_STOP_WORDS.some(
    (word) =>
      normalized === word ||
      tokens.includes(word) ||
      tokens.some((token) => token.startsWith(word)),
  );
}

function hasBrandLineMarkers(name: string) {
  const tokens = tokenizeName(name);

  if (tokens.some((token) => /[a-z]/.test(token))) {
    return true;
  }

  const specificTokens = tokens.filter(
    (token) =>
      !GENERIC_NAME_STOP_WORDS.includes(
        token as (typeof GENERIC_NAME_STOP_WORDS)[number],
      ) && !GENERIC_ADJECTIVES.has(token),
  );

  return specificTokens.length > 0;
}

export function isGenericAiProductName(name: string) {
  if (!containsStopWord(name)) return false;
  return !hasBrandLineMarkers(name);
}

export function isLowQualityAiResult(
  result: AnalyzeProductResponse,
  options?: { hasBarcode?: boolean },
) {
  if (options?.hasBarcode) return false;
  if (!isUnknownBrand(result.brand)) return false;
  return isGenericAiProductName(result.name);
}

export const GENERIC_AI_RESULT_MESSAGE =
  'Слишком общее название. Уточните (например: бренд + линейка)';
