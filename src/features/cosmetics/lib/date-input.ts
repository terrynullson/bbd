/** Дата в формате `<input type="date">` по ЛОКАЛЬНОМУ календарю (без сдвига UTC). */
export function toLocalIsoDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Сегодняшняя дата в формате `<input type="date">`. */
export function todayIso(): string {
  return toLocalIsoDate(new Date());
}

/** ISO-строку или дату — в значение для `<input type="date">`. */
export function toDateInputValue(value?: string): string {
  if (!value) return todayIso();
  return new Date(value).toISOString().slice(0, 10);
}

/** Грубые варианты «когда вскрыли» для тех, кто не помнит точную дату. */
export type OpeningPreset = 'this_month' | 'few_months' | 'half_year' | 'forgot';

/**
 * Представительная дата для грубого варианта. Смещение всегда к БОЛЕЕ
 * ранней границе — приложение про сроки годности должно предупреждать
 * раньше, а не позже. «Не помню» приравниваем к полугоду назад.
 */
export function openingPresetDate(preset: OpeningPreset, now = new Date()): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);

  switch (preset) {
    case 'this_month':
      d.setDate(1);
      break;
    case 'few_months':
      d.setMonth(d.getMonth() - 3);
      break;
    case 'half_year':
    case 'forgot':
      d.setMonth(d.getMonth() - 6);
      break;
  }

  return toLocalIsoDate(d);
}
