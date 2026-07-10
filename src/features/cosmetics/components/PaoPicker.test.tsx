import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PaoPicker } from './PaoPicker';

describe('PaoPicker', () => {
  it('показывает пресеты 6/12/24 и «Другое»', () => {
    render(<PaoPicker value={12} onChange={() => {}} />);
    expect(screen.getByText('6 мес')).toBeDefined();
    expect(screen.getByText('12 мес')).toBeDefined();
    expect(screen.getByText('24 мес')).toBeDefined();
    expect(screen.getByText('Другое')).toBeDefined();
  });

  it('нестандартное значение (9) открывает поле ввода, а не теряется', () => {
    render(<PaoPicker value={9} onChange={() => {}} />);
    const input = screen.getByLabelText(
      'Срок после вскрытия, месяцев',
    ) as HTMLInputElement;
    expect(input.value).toBe('9');
  });

  it('клик по пресету отдаёт число', () => {
    const onChange = vi.fn();
    render(<PaoPicker value={12} onChange={onChange} />);
    fireEvent.click(screen.getByText('24 мес'));
    expect(onChange).toHaveBeenCalledWith(24);
  });

  it('ввод в «Другое» ограничивается диапазоном 1–60', () => {
    const onChange = vi.fn();
    render(<PaoPicker value={9} onChange={onChange} />);
    const input = screen.getByLabelText('Срок после вскрытия, месяцев');

    fireEvent.change(input, { target: { value: '99' } });
    expect(onChange).toHaveBeenLastCalledWith(60);

    fireEvent.change(input, { target: { value: '0' } });
    expect(onChange).toHaveBeenLastCalledWith(1);
  });

  it('бейдж «≈ примерно» виден только для оценки', () => {
    const { rerender } = render(
      <PaoPicker value={12} isEstimate onChange={() => {}} />,
    );
    expect(screen.getByText('≈ примерно')).toBeDefined();

    rerender(<PaoPicker value={12} onChange={() => {}} />);
    expect(screen.queryByText('≈ примерно')).toBeNull();
  });
});
