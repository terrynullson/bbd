import { describe, expect, it } from 'vitest';
import { openingPresetDate } from './date-input';

// Локальный конструктор — тест детерминирован в любой таймзоне.
const NOW = new Date(2026, 6, 15, 12, 0, 0);

describe('openingPresetDate — консервативное смещение', () => {
  it('«в этом месяце» → первое число месяца', () => {
    expect(openingPresetDate('this_month', NOW)).toBe('2026-07-01');
  });

  it('«2–3 месяца назад» → минус три месяца (старший край)', () => {
    expect(openingPresetDate('few_months', NOW)).toBe('2026-04-15');
  });

  it('«полгода+ назад» → минус шесть месяцев', () => {
    expect(openingPresetDate('half_year', NOW)).toBe('2026-01-15');
  });

  it('«не помню» приравнено к полугоду — предупреждаем раньше, а не позже', () => {
    expect(openingPresetDate('forgot', NOW)).toBe(
      openingPresetDate('half_year', NOW),
    );
  });

  it('всегда в прошлом относительно now', () => {
    for (const p of ['this_month', 'few_months', 'half_year', 'forgot'] as const) {
      expect(openingPresetDate(p, NOW) <= '2026-07-15').toBe(true);
    }
  });
});
