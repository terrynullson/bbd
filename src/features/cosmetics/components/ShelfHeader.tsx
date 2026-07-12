'use client';

import { APP_NAME } from '@/lib/constants';
import { haptic } from '@/lib/haptics';
import { plural } from '../lib/plural';

type ShelfHeaderProps = {
  total: number;
  needsAttention: number;
  /** Имя из профиля, если пользователь вошёл. */
  userName?: string | null;
  /** Сколько напоминаний сейчас — число на бейдже. */
  count: number;
  onOpenNotifications: () => void;
};

function greetingFor(hour: number): string {
  if (hour < 5) return 'Доброй ночи';
  if (hour < 12) return 'Доброе утро';
  if (hour < 18) return 'Добрый день';
  return 'Добрый вечер';
}

function summaryFor(total: number, needsAttention: number): string {
  if (total === 0) return 'Полка пуста — добавьте первое средство';

  const items = `${total} ${plural(total, ['средство', 'средства', 'средств'])}`;
  if (needsAttention === 0) return `${items} · все в порядке`;

  const attention = plural(needsAttention, [
    'требует внимания',
    'требуют внимания',
    'требуют внимания',
  ]);
  return `${items} · ${needsAttention} ${attention}`;
}

export function ShelfHeader({
  total,
  needsAttention,
  userName,
  count,
  onOpenNotifications,
}: ShelfHeaderProps) {
  const greeting = greetingFor(new Date().getHours());
  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <header className="pt-1">
      <div className="flex items-start justify-between gap-3">
        <p className="quiet-label pt-3.5">BBD · {APP_NAME}</p>

        <button
          type="button"
          onClick={() => {
            haptic('light');
            onOpenNotifications();
          }}
          aria-label={
            count > 0 ? `Уведомления: ${count}` : 'Уведомления'
          }
          className="relative -mr-1 flex h-11 w-11 shrink-0 items-center justify-center text-text"
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
          >
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.7 21a2 2 0 0 1-3.4 0" />
          </svg>

          {count > 0 && (
            <span
              className="absolute right-1 top-1 flex min-w-[17px] items-center justify-center rounded-full px-1 text-[10px] font-bold text-surface"
              style={{ height: 17, background: 'var(--expired)' }}
            >
              {count > 9 ? '9+' : count}
            </span>
          )}
        </button>
      </div>

      <h1 className="font-display mt-2.5 text-[2rem] leading-tight text-text">
        {firstName ? `${greeting}, ${firstName}` : greeting}
      </h1>

      <p className="mt-1.5 text-sm text-muted">
        {summaryFor(total, needsAttention)}
      </p>
    </header>
  );
}
