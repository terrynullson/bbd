import { EXPIRING_THRESHOLD_DAYS } from '@/lib/constants';
import type { CosmeticStatus } from '../types';

export function calculateStatus(
  openedAt: string | Date,
  paoMonths: number,
  isSealed = false,
): CosmeticStatus {
  if (isSealed) return 'fresh';

  const openDate = new Date(openedAt);
  const expirationDate = new Date(openDate);
  expirationDate.setMonth(expirationDate.getMonth() + paoMonths);

  const diffDays = Math.ceil(
    (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );

  if (diffDays <= 0) return 'expired';
  if (diffDays <= EXPIRING_THRESHOLD_DAYS) return 'expiring';
  return 'fresh';
}

export function getDaysRemaining(
  openedAt: string | Date,
  paoMonths: number,
  isSealed = false,
): number {
  if (isSealed) return paoMonths * 30;

  const openDate = new Date(openedAt);
  const expirationDate = new Date(openDate);
  expirationDate.setMonth(expirationDate.getMonth() + paoMonths);

  return Math.ceil(
    (expirationDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24),
  );
}

export function getPaoProgress(
  openedAt: string | Date,
  paoMonths: number,
  isSealed = false,
): number {
  if (isSealed) return 0;

  const openDate = new Date(openedAt);
  const expirationDate = new Date(openDate);
  expirationDate.setMonth(expirationDate.getMonth() + paoMonths);

  const totalMs = expirationDate.getTime() - openDate.getTime();
  const elapsedMs = Date.now() - openDate.getTime();

  if (totalMs <= 0) return 100;
  return Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
}
