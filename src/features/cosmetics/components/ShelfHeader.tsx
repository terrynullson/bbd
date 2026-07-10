'use client';

import { APP_NAME } from '@/lib/constants';
import { plural } from '../lib/plural';

type ShelfHeaderProps = {
  total: number;
  needsAttention: number;
  /** Имя из профиля, если пользователь вошёл. */
  userName?: string | null;
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
}: ShelfHeaderProps) {
  const greeting = greetingFor(new Date().getHours());
  const firstName = userName?.trim().split(/\s+/)[0];

  return (
    <header className="pt-1">
      <p className="quiet-label">BBD · {APP_NAME}</p>

      <h1 className="font-display mt-2.5 text-[2rem] leading-tight text-text">
        {firstName ? `${greeting}, ${firstName}` : greeting}
      </h1>

      <p className="mt-1.5 text-sm text-muted">
        {summaryFor(total, needsAttention)}
      </p>
    </header>
  );
}
