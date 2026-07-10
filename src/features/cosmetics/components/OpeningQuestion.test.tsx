import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { OpeningQuestion } from './OpeningQuestion';
import { todayIso } from '../lib/date-input';

function setup(initial = { openedAt: todayIso(), isSealed: false }) {
  const onChange = vi.fn();
  render(<OpeningQuestion value={initial} onChange={onChange} />);
  return onChange;
}

describe('OpeningQuestion', () => {
  it('«Сегодня» ставит сегодняшнюю дату и снимает sealed', () => {
    const onChange = setup({ openedAt: '2020-01-01', isSealed: true });
    fireEvent.click(screen.getByText('Сегодня'));
    expect(onChange).toHaveBeenCalledWith({
      openedAt: todayIso(),
      isSealed: false,
    });
  });

  it('«Ещё не вскрыла» включает sealed', () => {
    const onChange = setup();
    fireEvent.click(screen.getByText('Ещё не вскрыла'));
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ isSealed: true }),
    );
  });

  it('«Раньше» раскрывает грубые чипы и подставляет прошлую дату', () => {
    const onChange = setup();
    fireEvent.click(screen.getByText('Раньше'));
    expect(screen.getByText('Полгода+ назад')).toBeDefined();

    fireEvent.click(screen.getByText('Полгода+ назад'));
    const call = onChange.mock.calls.at(-1)?.[0];
    expect(call.isSealed).toBe(false);
    expect(call.openedAt < todayIso()).toBe(true);
  });

  it('запечатанное показывает подсказку про EXP', () => {
    setup({ openedAt: todayIso(), isSealed: true });
    expect(screen.getByText(/Годен до.*с упаковки/)).toBeDefined();
  });
});
