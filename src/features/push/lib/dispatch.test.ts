import { describe, expect, it } from 'vitest';
import type { Reminder } from '@/features/cosmetics/lib/reminders';
import { buildPushPayload, filterUnsentReminders } from './dispatch';

function reminder(o: Partial<Reminder> & { id: string }): Reminder {
  return {
    itemId: o.id.split(':')[0],
    name: 'Мицеллярная вода',
    kind: 'expiring',
    daysLeft: 7,
    message: 'Истекает через 7 дней',
    ...o,
  };
}

describe('buildPushPayload', () => {
  it('заголовок — название, текст — message, tag — стабильный id', () => {
    const payload = buildPushPayload(reminder({ id: 'abc:expiring' }));
    expect(payload.title).toBe('Мицеллярная вода');
    expect(payload.body).toBe('Истекает через 7 дней');
    expect(payload.tag).toBe('abc:expiring');
    expect(payload.itemId).toBe('abc');
    expect(payload.url).toContain('abc');
  });

  it('itemId в url экранируется', () => {
    const payload = buildPushPayload(reminder({ id: 'a b:expiring', itemId: 'a b' }));
    expect(payload.url).toBe('/?notif=a%20b');
  });
});

describe('filterUnsentReminders', () => {
  it('отсекает уже отправленные по стабильному id', () => {
    const reminders = [
      reminder({ id: 'a:expiring' }),
      reminder({ id: 'b:expired' }),
      reminder({ id: 'c:expiring' }),
    ];
    const sent = new Set(['b:expired']);
    expect(filterUnsentReminders(reminders, sent).map((r) => r.id)).toEqual([
      'a:expiring',
      'c:expiring',
    ]);
  });

  it('повторный прогон с полным журналом не даёт ничего (дедуп)', () => {
    const reminders = [reminder({ id: 'a:expiring' }), reminder({ id: 'b:expired' })];
    const sent = new Set(reminders.map((r) => r.id));
    expect(filterUnsentReminders(reminders, sent)).toHaveLength(0);
  });

  it('переход expiring→expired уходит как новое напоминание', () => {
    // Ушло `x:expiring`, наступила просрочка → `x:expired` ещё нет в журнале.
    const sent = new Set(['x:expiring']);
    const next = [reminder({ id: 'x:expired', kind: 'expired' })];
    expect(filterUnsentReminders(next, sent).map((r) => r.id)).toEqual(['x:expired']);
  });

  it('пустой журнал пропускает все', () => {
    const reminders = [reminder({ id: 'a:expiring' })];
    expect(filterUnsentReminders(reminders, new Set())).toHaveLength(1);
  });
});
