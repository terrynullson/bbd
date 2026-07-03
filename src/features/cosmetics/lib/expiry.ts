import type { CosmeticItem } from '../types';

export type LimitingFactor = 'box' | 'pao' | 'none';

export type ExpiryParams = Pick<
  CosmeticItem,
  'openedAt' | 'paoMonths' | 'isSealed' | 'expiresAt'
>;

export const NO_EXPIRY_SORT_DAYS = Number.MAX_SAFE_INTEGER;

function startOfDay(value: string | Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(value: string | Date): Date {
  const date = new Date(value);
  date.setHours(23, 59, 59, 999);
  return date;
}

function addMonths(value: string | Date, months: number): Date {
  const date = startOfDay(value);
  date.setMonth(date.getMonth() + months);
  date.setHours(23, 59, 59, 999);
  return date;
}

export function getPaoEndDate(openedAt: string | Date, paoMonths: number): Date {
  return addMonths(openedAt, paoMonths);
}

export function getBoxEndDate(expiresAt?: string | Date): Date | null {
  if (!expiresAt) return null;
  return endOfDay(expiresAt);
}

export function resolveExpiry(params: ExpiryParams) {
  const isSealed = params.isSealed ?? false;
  const boxEnd = getBoxEndDate(params.expiresAt);
  const paoEnd = isSealed
    ? null
    : getPaoEndDate(params.openedAt, params.paoMonths);

  if (isSealed) {
    return {
      effectiveEnd: boxEnd,
      limitingFactor: (boxEnd ? 'box' : 'none') as LimitingFactor,
      paoEnd: null as Date | null,
      boxEnd,
    };
  }

  if (boxEnd && paoEnd) {
    const boxFirst = boxEnd.getTime() <= paoEnd.getTime();
    return {
      effectiveEnd: boxFirst ? boxEnd : paoEnd,
      limitingFactor: (boxFirst ? 'box' : 'pao') as LimitingFactor,
      paoEnd,
      boxEnd,
    };
  }

  if (boxEnd) {
    return {
      effectiveEnd: boxEnd,
      limitingFactor: 'box' as LimitingFactor,
      paoEnd,
      boxEnd,
    };
  }

  if (paoEnd) {
    return {
      effectiveEnd: paoEnd,
      limitingFactor: 'pao' as LimitingFactor,
      paoEnd,
      boxEnd,
    };
  }

  return {
    effectiveEnd: null as Date | null,
    limitingFactor: 'none' as LimitingFactor,
    paoEnd,
    boxEnd,
  };
}

export function getDaysUntil(end: Date | null): number | null {
  if (!end) return null;
  return Math.ceil((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

export function expiryParamsFromItem(item: ExpiryParams): ExpiryParams {
  return {
    openedAt: item.openedAt,
    paoMonths: item.paoMonths,
    isSealed: item.isSealed,
    expiresAt: item.expiresAt,
  };
}

export function formatExpiryDate(value: string | Date): string {
  return new Date(value).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function getLimitingLabel(
  factor: LimitingFactor,
  expiresAt?: string,
): string | null {
  if (factor === 'box' && expiresAt) {
    return `Ограничивает: годен до ${formatExpiryDate(expiresAt)}`;
  }
  if (factor === 'pao') {
    return 'Ограничивает: срок после вскрытия';
  }
  return null;
}
