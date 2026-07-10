import { describe, expect, it } from 'vitest';
import {
  filterLocalBrands,
  filterLocalProducts,
  mergeSuggestions,
  normalizeQuery,
} from './suggestions';
import type { CosmeticItem, ProductSuggestion } from '../types';

function suggestion(
  overrides: Partial<ProductSuggestion> & { name: string },
): ProductSuggestion {
  return { id: overrides.name, source: 'catalog', ...overrides };
}

function item(overrides: Partial<CosmeticItem> & { name: string }): CosmeticItem {
  return {
    id: overrides.name,
    brand: 'Неизвестный бренд',
    paoMonths: 12,
    openedAt: '2026-01-01T00:00:00.000Z',
    status: 'fresh',
    category: 'other',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as CosmeticItem;
}

describe('normalizeQuery', () => {
  it('обрезает пробелы и приводит к нижнему регистру', () => {
    expect(normalizeQuery('  СыВоРоТкА ')).toBe('сыворотка');
  });
});

describe('mergeSuggestions', () => {
  it('локальные подсказки идут первыми', () => {
    const merged = mergeSuggestions(
      [suggestion({ name: 'Локальный', source: 'local' })],
      [suggestion({ name: 'Серверный' })],
    );
    expect(merged.map((s) => s.name)).toEqual(['Локальный', 'Серверный']);
  });

  it('отбрасывает дубликаты по паре «бренд + название»', () => {
    const merged = mergeSuggestions(
      [suggestion({ name: 'Крем', brand: 'CeraVe', source: 'local' })],
      [suggestion({ name: '  крем  ', brand: 'cerave' })],
    );
    expect(merged).toHaveLength(1);
    expect(merged[0].source).toBe('local');
  });

  it('одинаковые названия у разных брендов — не дубликаты', () => {
    const merged = mergeSuggestions(
      [],
      [
        suggestion({ name: 'Крем', brand: 'CeraVe' }),
        suggestion({ name: 'Крем', brand: 'Nivea' }),
      ],
    );
    expect(merged).toHaveLength(2);
  });

  it('не отдаёт больше восьми штук', () => {
    const many = Array.from({ length: 20 }, (_, i) =>
      suggestion({ name: `Товар ${i}` }),
    );
    expect(mergeSuggestions([], many)).toHaveLength(8);
  });

  it('пропускает записи с пустым ключом', () => {
    expect(mergeSuggestions([], [suggestion({ name: '   ' })])).toHaveLength(0);
  });
});

describe('filterLocalProducts', () => {
  const items = [
    item({ name: 'Крем для лица', brand: 'CeraVe' }),
    item({ name: 'Крем для рук', brand: 'Nivea' }),
    item({ name: 'Сыворотка', brand: 'The Ordinary' }),
  ];

  it('ищет по подстроке названия без учёта регистра', () => {
    expect(filterLocalProducts(items, 'КРЕМ').map((s) => s.name)).toEqual([
      'Крем для лица',
      'Крем для рук',
    ]);
  });

  it('бренд сужает выдачу', () => {
    expect(filterLocalProducts(items, 'крем', 'Nivea').map((s) => s.name)).toEqual([
      'Крем для рук',
    ]);
  });

  it('пустой запрос ничего не возвращает', () => {
    expect(filterLocalProducts(items, '   ')).toEqual([]);
  });

  it('помечает источник как local', () => {
    expect(filterLocalProducts(items, 'сыворотка')[0].source).toBe('local');
  });
});

describe('filterLocalBrands', () => {
  it('возвращает бренд как имя подсказки', () => {
    const items = [item({ name: 'Крем', brand: 'CeraVe' })];
    const found = filterLocalBrands(items, 'cera');
    expect(found).toHaveLength(1);
    expect(found[0].name).toBe('CeraVe');
  });
});
