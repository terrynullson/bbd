/** Сегодняшняя дата в формате `<input type="date">`. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** ISO-строку или дату — в значение для `<input type="date">`. */
export function toDateInputValue(value?: string): string {
  if (!value) return todayIso();
  return new Date(value).toISOString().slice(0, 10);
}
