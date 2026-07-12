import type { Reminder } from '@/features/cosmetics/lib/reminders';

/** Payload, который сервер шлёт в push и разбирает `public/sw.js`. */
export type PushPayload = {
  title: string;
  body: string;
  /** = reminder.id: одно средство обновляет своё уведомление, а не плодит стопку. */
  tag: string;
  url: string;
  itemId: string;
};

/**
 * Уведомление из напоминания: заголовок — название средства, текст — готовое
 * `message` из [buildReminders]. Клик ведёт на приложение с подсветкой средства.
 */
export function buildPushPayload(reminder: Reminder): PushPayload {
  return {
    title: reminder.name,
    body: reminder.message,
    tag: reminder.id,
    url: `/?notif=${encodeURIComponent(reminder.itemId)}`,
    itemId: reminder.itemId,
  };
}

/**
 * Дедуп: оставляет только те напоминания, которых ещё нет в журнале
 * (`sentIds` = множество уже отправленных `reminder.id`). Стабильный id
 * гарантирует, что одно и то же напоминание не уйдёт дважды, а переход
 * expiring→expired (новый id) уйдёт как новое.
 */
export function filterUnsentReminders(
  reminders: Reminder[],
  sentIds: ReadonlySet<string>,
): Reminder[] {
  return reminders.filter((reminder) => !sentIds.has(reminder.id));
}
