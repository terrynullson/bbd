/** Русские склонения: plural(2, ['день', 'дня', 'дней']) → 'дня' */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(n) % 100;
  const tail = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (tail > 1 && tail < 5) return forms[1];
  if (tail === 1) return forms[0];
  return forms[2];
}

export function daysText(n: number): string {
  return `${n} ${plural(n, ['день', 'дня', 'дней'])}`;
}

/** Короткий остаток срока по календарным дням: 0 → «сегодня». */
export function remainingText(calendarDays: number): string {
  if (calendarDays === 0) return 'сегодня';
  return daysText(calendarDays);
}

/** Полная строка остатка для карточки: «истекает сегодня» / «осталось N» / «просрочен N назад». */
export function daysLeftLine(calendarDays: number): string {
  if (calendarDays === 0) return 'истекает сегодня';
  if (calendarDays < 0) return `просрочен ${daysText(-calendarDays)} назад`;
  return `осталось ${daysText(calendarDays)}`;
}
