import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AddProductModal } from './AddProductModal';

vi.mock('@/lib/supabase/use-auth', () => ({
  useAuth: () => ({ user: null, supabase: null, status: 'signed-out' }),
}));
vi.mock('../api/catalog-product', () => ({ upsertCatalogProduct: vi.fn() }));

function setup() {
  const onSubmit = vi.fn();
  render(
    <AddProductModal
      localItems={[]}
      onClose={() => {}}
      onSubmit={onSubmit}
    />,
  );
  return { onSubmit };
}

function typeName(value: string) {
  fireEvent.change(screen.getByLabelText('Название продукта'), {
    target: { value },
  });
}

describe('AddProductModal — правило EXP для запечатанного', () => {
  it('запечатанное без «Годен до» не сохраняется (как в быстром вводе)', () => {
    const { onSubmit } = setup();
    typeName('Крем про запас');
    fireEvent.click(screen.getByText('Ещё не вскрыла'));
    fireEvent.click(screen.getByText('Сохранить'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText(/Для неоткрытого укажите/)).toBeDefined();
  });

  it('с указанным EXP запечатанное сохраняется', () => {
    const { onSubmit } = setup();
    typeName('Крем про запас');
    fireEvent.click(screen.getByText('Ещё не вскрыла'));

    const exp = document.querySelector('input[type="date"]') as HTMLInputElement;
    fireEvent.change(exp, { target: { value: '2027-08-16' } });

    fireEvent.click(screen.getByText('Сохранить'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0][0].isSealed).toBe(true);
  });
});
