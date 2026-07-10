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
