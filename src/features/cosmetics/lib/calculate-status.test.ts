import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  calculateStatus,
  getDaysRemaining,
  getPaoProgress,
  resolveExpiry,
} from './calculate-status';
import { NO_EXPIRY_SORT_DAYS, type ExpiryParams } from './expiry';

const NOW = new Date('2026-07-10T12:00:00.000Z');
const DAY = 86_400_000;

/** Дата, сдвинутая от «сейчас» на N дней. */
function shift(days: number): string {
  return new Date(NOW.getTime() + days * DAY).toISOString();
}

function params(overrides: Partial<ExpiryParams> = {}): ExpiryParams {
  return {
    openedAt: shift(-30),
    paoMonths: 12,
    isSealed: false,
    expiresAt: undefined,
    ...overrides,
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe('resolveExpiry — дуальный срок', () => {
  it('без EXP ограничивает PAO', () => {
    const { limitingFactor, effectiveEnd } = resolveExpiry(params());
    expect(limitingFactor).toBe('pao');
    expect(effectiveEnd).toBeInstanceOf(Date);
  });

  it('берёт наименьшее из EXP и PAO', () => {
    // EXP через 10 дней, PAO — через ~11 месяцев
    const early = resolveExpiry(params({ expiresAt: shift(10) }));
    expect(early.limitingFactor).toBe('box');

    // EXP через 5 лет, PAO раньше
    const late = resolveExpiry(params({ expiresAt: shift(1825) }));
    expect(late.limitingFactor).toBe('pao');
  });

  it('запечатанное средство игнорирует PAO', () => {
    const sealed = resolveExpiry(
      params({ isSealed: true, expiresAt: shift(100) }),
    );
    expect(sealed.limitingFactor).toBe('box');
    expect(sealed.paoEnd).toBeNull();
  });

  it('запечатанное без EXP не имеет срока вовсе', () => {
    const sealed = resolveExpiry(params({ isSealed: true }));
    expect(sealed.effectiveEnd).toBeNull();
    expect(sealed.limitingFactor).toBe('none');
  });
});

describe('calculateStatus', () => {
  it('срок истёк — expired', () => {
    expect(calculateStatus(params({ expiresAt: shift(-1) }))).toBe('expired');
  });

  it('порог «скоро» — 30 дней включительно', () => {
    expect(calculateStatus(params({ expiresAt: shift(29) }))).toBe('expiring');
    expect(calculateStatus(params({ expiresAt: shift(45) }))).toBe('fresh');
  });

  it('без срока считается свежим', () => {
    expect(calculateStatus(params({ isSealed: true }))).toBe('fresh');
  });

  it('PAO может просрочить средство без EXP', () => {
    expect(calculateStatus(params({ openedAt: shift(-400) }))).toBe('expired');
  });
});

describe('getDaysRemaining', () => {
  // Срок действует до конца дня EXP, поэтому сегодняшний день входит в остаток:
  // дата «через 10 дней» показывается как 11. Поведение зафиксировано намеренно —
  // менять только вместе с текстами на полке и в карточке.
  it('день EXP входит в остаток', () => {
    expect(getDaysRemaining(params({ expiresAt: shift(10) }))).toBe(11);
    expect(getDaysRemaining(params({ expiresAt: shift(0) }))).toBe(1);
  });

  it('просроченное отдаёт неположительное число', () => {
    expect(getDaysRemaining(params({ expiresAt: shift(-5) }))).toBeLessThanOrEqual(0);
  });

  it('без срока — сортировочная заглушка, а не ноль', () => {
    expect(getDaysRemaining(params({ isSealed: true }))).toBe(NO_EXPIRY_SORT_DAYS);
  });
});

describe('getPaoProgress', () => {
  it('в начале срока — около нуля', () => {
    const progress = getPaoProgress(params({ openedAt: shift(0) }));
    expect(progress).toBeLessThan(5);
  });

  it('на середине — около половины', () => {
    // PAO 12 мес ≈ 365 дней, вскрыто 183 дня назад
    const progress = getPaoProgress(params({ openedAt: shift(-183) }));
    expect(progress).toBeGreaterThan(45);
    expect(progress).toBeLessThan(55);
  });

  it('после истечения — ровно 100, без выхода за границу', () => {
    expect(getPaoProgress(params({ openedAt: shift(-800) }))).toBe(100);
  });

  it('без срока — ноль', () => {
    expect(getPaoProgress(params({ isSealed: true }))).toBe(0);
  });
});
