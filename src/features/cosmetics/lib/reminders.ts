import { REMINDER_WINDOW_DAYS } from '@/lib/constants';
import { getDaysRemaining, resolveExpiry } from './calculate-status';
import { expiryParamsFromItem } from './expiry';
import { daysText } from './plural';
import type { CosmeticItem } from '../types';

export type ReminderKind = 'expired' | 'expiring';

export type Reminder = {
  /** Стабильный ключ item+kind: переход expiring→expired даёт новое напоминание. */
  id: string;
  itemId: string;
  name: string;
  kind: ReminderKind;
  /** Календарные дни: отрицательные — просрочено. */
  daysLeft: number;
  message: string;
};

function reminderMessage(kind: ReminderKind, daysLeft: number): string {
  if (kind === 'expired') {
    if (daysLeft === 0) return 'Срок вышел сегодня — лучше заменить';
    return `Срок вышел ${daysText(-daysLeft)} назад — лучше заменить`;
  }
  if (daysLeft === 0) return 'Истекает сегодня';
  return `Истекает через ${daysText(daysLeft)}`;
}

/**
 * Что требует внимания: просроченное + истекающее в ближайшие `withinDays`.
 * Средства без срока (запечатанные без EXP) не напоминают. Порядок — по
 * срочности (просрочка первой).
 */
export function buildReminders(
  items: CosmeticItem[],
  withinDays: number = REMINDER_WINDOW_DAYS,
): Reminder[] {
  const reminders: Reminder[] = [];

  for (const item of items) {
    if (item.deletedAt) continue;

    const params = expiryParamsFromItem(item);
    const { effectiveEnd } = resolveExpiry(params);
    if (!effectiveEnd) continue;

    const daysLeft = getDaysRemaining(params);
    const kind: ReminderKind | null =
      daysLeft < 0 ? 'expired' : daysLeft <= withinDays ? 'expiring' : null;
    if (!kind) continue;

    reminders.push({
      id: `${item.id}:${kind}`,
      itemId: item.id,
      name: item.name,
      kind,
      daysLeft,
      message: reminderMessage(kind, daysLeft),
    });
  }

  return reminders.sort((a, b) => a.daysLeft - b.daysLeft);
}

/** Сколько напоминаний ещё не показывалось (для бейджа на колокольчике). */
export function countUnseen(reminders: Reminder[], seen: string[]): number {
  const seenSet = new Set(seen);
  return reminders.filter((r) => !seenSet.has(r.id)).length;
}
