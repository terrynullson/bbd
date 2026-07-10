import { describe, expect, it } from 'vitest';
import { daysLeftLine, daysText, plural, remainingText } from './plural';

const DAYS: [string, string, string] = ['день', 'дня', 'дней'];

describe('plural', () => {
  it('склоняет по последней цифре', () => {
    expect(plural(1, DAYS)).toBe('день');
    expect(plural(2, DAYS)).toBe('дня');
    expect(plural(4, DAYS)).toBe('дня');
    expect(plural(5, DAYS)).toBe('дней');
    expect(plural(21, DAYS)).toBe('день');
    expect(plural(22, DAYS)).toBe('дня');
  });

  it('11–19 — исключение, всегда третья форма', () => {
    for (const n of [11, 12, 14, 15, 19, 111, 112]) {
      expect(plural(n, DAYS)).toBe('дней');
    }
  });

  it('ноль — третья форма', () => {
    expect(plural(0, DAYS)).toBe('дней');
  });

  it('отрицательные числа склоняются по модулю', () => {
    expect(plural(-1, DAYS)).toBe('день');
    expect(plural(-13, DAYS)).toBe('дней');
  });

  it('daysText собирает число со словом', () => {
    expect(daysText(1)).toBe('1 день');
    expect(daysText(366)).toBe('366 дней');
  });
});

describe('remainingText', () => {
  it('ноль дней — «сегодня»', () => {
    expect(remainingText(0)).toBe('сегодня');
  });

  it('положительное — число со склонением', () => {
    expect(remainingText(1)).toBe('1 день');
    expect(remainingText(10)).toBe('10 дней');
  });
});

describe('daysLeftLine', () => {
  it('сегодня', () => {
    expect(daysLeftLine(0)).toBe('истекает сегодня');
  });

  it('впереди', () => {
    expect(daysLeftLine(1)).toBe('осталось 1 день');
    expect(daysLeftLine(365)).toBe('осталось 365 дней');
  });

  it('просрочка по модулю', () => {
    expect(daysLeftLine(-1)).toBe('просрочен 1 день назад');
    expect(daysLeftLine(-5)).toBe('просрочен 5 дней назад');
  });
});
