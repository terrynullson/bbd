import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { buildReminders, countUnseen } from './reminders';
import type { CosmeticItem } from '../types';

const NOW = new Date('2026-07-10T12:00:00.000Z');
const DAY = 86_400_000;
const shift = (d: number) => new Date(NOW.getTime() + d * DAY).toISOString();

function item(o: Partial<CosmeticItem> & { id: string }): CosmeticItem {
  return {
    name: `Средство ${o.id}`,
    brand: 'Бренд',
    paoMonths: 12,
    openedAt: shift(-30),
    status: 'fresh',
    category: 'cream',
    createdAt: shift(-30),
    ...o,
  } as CosmeticItem;
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});
afterEach(() => vi.useRealTimers());

describe('buildReminders', () => {
  it('просроченное и близко истекающее попадают, дальнее — нет', () => {
    const items = [
      item({ id: 'exp', expiresAt: shift(-3) }),
      item({ id: 'soon', expiresAt: shift(5) }),
      item({ id: 'far', expiresAt: shift(90) }),
    ];
    const ids = buildReminders(items, 14).map((r) => r.itemId);
    expect(ids).toContain('exp');
    expect(ids).toContain('soon');
    expect(ids).not.toContain('far');
  });

  it('сортировка по срочности: просрочка первой', () => {
    const items = [
      item({ id: 'soon', expiresAt: shift(5) }),
      item({ id: 'exp', expiresAt: shift(-3) }),
    ];
    expect(buildReminders(items, 14).map((r) => r.itemId)).toEqual(['exp', 'soon']);
  });

  it('вид и текст различают просрочку и скорое', () => {
    const [a, b] = buildReminders(
      [item({ id: 'exp', expiresAt: shift(-2) }), item({ id: 'soon', expiresAt: shift(3) })],
      14,
    );
    expect(a.kind).toBe('expired');
    expect(a.message).toMatch(/Срок вышел/);
    expect(b.kind).toBe('expiring');
    expect(b.message).toMatch(/через/);
  });

  it('удалённые и без срока не напоминают', () => {
    const items = [
      item({ id: 'del', expiresAt: shift(-1), deletedAt: shift(-1) }),
      item({ id: 'sealed', isSealed: true }),
    ];
    expect(buildReminders(items, 14)).toHaveLength(0);
  });

  it('id меняется при переходе скорое→просрочено (повторное напоминание)', () => {
    expect(buildReminders([item({ id: 'x', expiresAt: shift(3) })], 14)[0].id).toBe(
      'x:expiring',
    );
    expect(buildReminders([item({ id: 'x', expiresAt: shift(-1) })], 14)[0].id).toBe(
      'x:expired',
    );
  });
});

describe('countUnseen', () => {
  it('считает непоказанные по id', () => {
    const reminders = buildReminders(
      [item({ id: 'a', expiresAt: shift(-1) }), item({ id: 'b', expiresAt: shift(2) })],
      14,
    );
    expect(countUnseen(reminders, [])).toBe(2);
    expect(countUnseen(reminders, ['a:expired'])).toBe(1);
    expect(countUnseen(reminders, ['a:expired', 'b:expiring'])).toBe(0);
  });
});
