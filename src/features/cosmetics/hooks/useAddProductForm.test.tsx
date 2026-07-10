import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAddProductForm } from './useAddProductForm';

describe('useAddProductForm — вывод PAO', () => {
  it('по умолчанию PAO пресетный', () => {
    const { result } = renderHook(() => useAddProductForm());
    expect(result.current.paoSource).toBe('preset');
    expect(result.current.paoMonths).toBe(12);
  });

  it('пресет следует за названием', () => {
    const { result } = renderHook(() => useAddProductForm());

    act(() => result.current.setName('Сыворотка с витамином C'));
    expect(result.current.paoMonths).toBe(6);
    expect(result.current.paoSource).toBe('preset');

    act(() => result.current.setName('Парфюм вечерний'));
    expect(result.current.paoMonths).toBe(24);
  });

  it('ручной выбор фиксирует значение и переживает смену названия', () => {
    const { result } = renderHook(() => useAddProductForm());

    act(() => result.current.setPaoMonths(3));
    expect(result.current.paoSource).toBe('user');

    act(() => result.current.setName('Парфюм вечерний'));
    expect(result.current.paoMonths).toBe(3);
    expect(result.current.paoSource).toBe('user');
  });

  it('значение из каталога тоже не перетирается пресетом', () => {
    const { result } = renderHook(() => useAddProductForm());

    act(() => result.current.setPaoMonths(18, 'catalog'));
    act(() => result.current.setName('Сыворотка'));

    expect(result.current.paoMonths).toBe(18);
    expect(result.current.paoSource).toBe('catalog');
  });

  it('paoMonths из начальных значений считается выбором пользователя', () => {
    const { result } = renderHook(() =>
      useAddProductForm({ name: 'Сыворотка', paoMonths: 24 }),
    );
    expect(result.current.paoMonths).toBe(24);
    expect(result.current.paoSource).toBe('user');
  });

  it('без paoMonths в начальных значениях пресет считается по названию', () => {
    const { result } = renderHook(() =>
      useAddProductForm({ name: 'Сыворотка с ниацинамидом' }),
    );
    expect(result.current.paoMonths).toBe(6);
    expect(result.current.paoSource).toBe('preset');
  });

  it('явный paoSource preset не замораживает значение', () => {
    const { result } = renderHook(() =>
      useAddProductForm({ paoMonths: 24, paoSource: 'preset' }),
    );
    act(() => result.current.setName('Сыворотка'));
    expect(result.current.paoMonths).toBe(6);
  });
});

describe('useAddProductForm — buildInput', () => {
  it('без названия ничего не собирает', () => {
    const { result } = renderHook(() => useAddProductForm());
    expect(result.current.buildInput()).toBeNull();
  });

  it('пустой бренд заменяется заглушкой', () => {
    const { result } = renderHook(() => useAddProductForm());
    act(() => result.current.setName('Крем'));

    expect(result.current.buildInput()?.brand).toBe('Неизвестный бренд');
  });

  it('категория other выводится из текста, таксономия проставляется', () => {
    const { result } = renderHook(() => useAddProductForm());
    act(() => result.current.setName('Ночной крем с ретинолом'));

    const input = result.current.buildInput();
    expect(input?.category).toBe('cream');
    expect(input?.productSubtype).toBe('night_cream');
    expect(input?.productGroup).toBe('skincare');
  });

  it('обрезает пробелы в названии', () => {
    const { result } = renderHook(() => useAddProductForm());
    act(() => result.current.setName('   Крем   '));

    expect(result.current.buildInput()?.name).toBe('Крем');
  });

  it('без штрих-кода не выставляет источник и доверие', () => {
    const { result } = renderHook(() => useAddProductForm());
    act(() => result.current.setName('Крем'));

    const input = result.current.buildInput();
    expect(input?.barcode).toBeUndefined();
    expect(input?.barcodeSource).toBeUndefined();
    expect(input?.barcodeTrust).toBeUndefined();
  });

  it('штрих-код, введённый руками, помечается source=manual', () => {
    const { result } = renderHook(() => useAddProductForm());
    act(() => result.current.setName('Крем'));
    act(() => result.current.setBarcode('4600682001234'));

    const input = result.current.buildInput();
    expect(input?.barcodeSource).toBe('manual');
    expect(input?.barcodeTrust).toBeDefined();
  });

  it('EXP заполняет expirySource, пустой — нет', () => {
    const { result } = renderHook(() => useAddProductForm());
    act(() => result.current.setName('Крем'));
    expect(result.current.buildInput()?.expirySource).toBeUndefined();

    act(() => result.current.setExpiresAt('2027-01-01'));
    expect(result.current.buildInput()?.expirySource).toBe('user');
  });
});

describe('useAddProductForm — reset', () => {
  it('возвращает форму к исходному состоянию', () => {
    const { result } = renderHook(() => useAddProductForm());

    act(() => {
      result.current.setName('Крем');
      result.current.setBrand('CeraVe');
      result.current.setPaoMonths(3);
      result.current.setIsSealed(false);
    });

    act(() => result.current.reset());

    expect(result.current.name).toBe('');
    expect(result.current.brand).toBe('');
    expect(result.current.paoSource).toBe('preset');
    expect(result.current.isSealed).toBe(true);
  });
});
