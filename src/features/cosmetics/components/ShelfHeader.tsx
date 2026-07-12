'use client';

import { APP_NAME } from '@/lib/constants';
import { haptic } from '@/lib/haptics';
import { plural } from '../lib/plural';

type ShelfHeaderProps = {
  total: number;
  needsAttention: number;
  /** Имя из профиля, если пользователь вошёл. */
  userName?: string | null;
  /** Число непоказанных напоминаний для бейджа. */
  unseenCount: number;
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
  unseenCount,
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
            unseenCount > 0
              ? `Уведомления, новых: ${unseenCount}`
              : 'Уведомления'
          }
          className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-text transition-colors hover:border-accent/40"
        >
          <svg
            width="20"
            height="20"
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

          {unseenCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex min-w-[19px] items-center justify-center rounded-full px-1 text-[11px] font-bold text-surface"
              style={{ height: 19, background: 'var(--expired)' }}
            >
              {unseenCount > 9 ? '9+' : unseenCount}
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
