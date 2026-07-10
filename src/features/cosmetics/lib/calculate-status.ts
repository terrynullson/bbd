import { EXPIRING_THRESHOLD_DAYS } from '@/lib/constants';
import type { CosmeticStatus } from '../types';
import {
  getCalendarDaysUntil,
  getDaysUntil,
  NO_EXPIRY_SORT_DAYS,
  resolveExpiry,
  type ExpiryParams,
} from './expiry';

function statusFromDays(days: number): CosmeticStatus {
  if (days <= 0) return 'expired';
  if (days <= EXPIRING_THRESHOLD_DAYS) return 'expiring';
  return 'fresh';
}

export function calculateStatus(params: ExpiryParams): CosmeticStatus {
  const { effectiveEnd } = resolveExpiry(params);
  if (!effectiveEnd) return 'fresh';

  const days = getDaysUntil(effectiveEnd);
  if (days === null) return 'fresh';
  return statusFromDays(days);
}

/** Календарные дни до срока: сегодня → 0, просрочка отрицательна. Для показа и сортировки. */
export function getDaysRemaining(params: ExpiryParams): number {
  const { effectiveEnd } = resolveExpiry(params);
  if (!effectiveEnd) return NO_EXPIRY_SORT_DAYS;

  const days = getCalendarDaysUntil(effectiveEnd);
  if (days === null) return NO_EXPIRY_SORT_DAYS;
  return days;
}

export function getPaoProgress(params: ExpiryParams): number {
  const isSealed = params.isSealed ?? false;
  const { effectiveEnd } = resolveExpiry(params);
  if (!effectiveEnd) return 0;

  const start = isSealed
    ? startOfProgress(params.openedAt)
    : startOfProgress(params.openedAt);
  const totalMs = effectiveEnd.getTime() - start.getTime();
  const elapsedMs = Date.now() - start.getTime();

  if (totalMs <= 0) return 100;
  return Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
}

function startOfProgress(value: string | Date): Date {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export { resolveExpiry, getLimitingLabel } from './expiry';
export type { LimitingFactor, ExpiryParams } from './expiry';
