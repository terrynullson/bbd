import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddManualTab } from './AddManualTab';

function setup() {
  const onSubmit = vi.fn();
  const onOpenFullForm = vi.fn();
  render(
    <AddManualTab
      localItems={[]}
      onSubmit={onSubmit}
      onOpenFullForm={onOpenFullForm}
    />,
  );
  return { onSubmit, onOpenFullForm };
}

function typeName(value: string) {
  fireEvent.change(screen.getByLabelText('Название средства'), {
    target: { value },
  });
}

describe('AddManualTab', () => {
  it('категория из быстрого ввода убрана (правится в полной форме)', () => {
    setup();
    expect(screen.queryByText('Категория')).toBeNull();
    expect(screen.getByText('Когда вскрыли?')).toBeDefined();
  });

  it('по умолчанию — вскрыто сегодня, PAO виден', () => {
    setup();
    expect(screen.getByText('Срок после вскрытия')).toBeDefined();
  });

  it('«Сегодня» сохраняет как вскрытое', () => {
    const { onSubmit } = setup();
    typeName('Ночной крем с ретинолом');
    fireEvent.click(screen.getByText('Добавить на полку'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    const input = onSubmit.mock.calls[0][0];
    expect(input.isSealed).toBe(false);
    expect(input.category).toBe('cream');
    expect(input.productSubtype).toBe('night_cream');
  });

  it('запечатанное без «Годен до» не сохраняется', () => {
    const { onSubmit } = setup();
    typeName('Крем про запас');
    fireEvent.click(screen.getByText('Ещё не вскрыла'));
    fireEvent.click(screen.getByText('Добавить на полку'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Для неоткрытого укажите/)).toBeDefined();
  });

  it('запечатанное прячет PAO', () => {
    setup();
    typeName('Крем про запас');
    fireEvent.click(screen.getByText('Ещё не вскрыла'));
    expect(screen.queryByText('Срок после вскрытия')).toBeNull();
  });
});
