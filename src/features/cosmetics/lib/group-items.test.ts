import { describe, expect, it } from 'vitest';
import { buildShelfSections } from './group-items';
import type { CosmeticItem } from '../types';

function item(overrides: Partial<CosmeticItem> & { id: string }): CosmeticItem {
  return {
    name: 'Средство',
    brand: 'Бренд',
    paoMonths: 12,
    openedAt: '2026-01-01T00:00:00.000Z',
    status: 'fresh',
    category: 'other',
    createdAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  } as CosmeticItem;
}

describe('buildShelfSections', () => {
  it('раскладывает по макро-секциям в порядке GROUP_ORDER', () => {
    const items = [
      item({ id: 'a', category: 'serum', productGroup: 'skincare' }),
      item({ id: 'b', category: 'makeup', productGroup: 'makeup' }),
      item({ id: 'c', category: 'fragrance', productGroup: 'fragrance' }),
    ];

    const titles = buildShelfSections(items).map((s) => s.title);
    expect(titles).toEqual(['Уход за кожей', 'Макияж', 'Ароматы']);
  });

  it('срочные всплывают отдельной секцией первыми', () => {
    const items = [
      item({ id: 'a', category: 'serum', productGroup: 'skincare', status: 'fresh' }),
      item({ id: 'b', category: 'cream', productGroup: 'skincare', status: 'expired' }),
    ];

    const sections = buildShelfSections(items);
    expect(sections[0].title).toBe('Скоро истекает');
    expect(sections[0].items).toHaveLength(1);
    expect(sections[0].items[0].id).toBe('b');
  });

  it('запечатанный неспешный товар уходит в «Запас»', () => {
    const items = [
      item({ id: 'a', category: 'cream', productGroup: 'skincare' }),
      item({ id: 'b', category: 'cream', productGroup: 'skincare', isSealed: true }),
    ];

    const sections = buildShelfSections(items);
    expect(sections.at(-1)?.title).toBe('Запас');
    expect(sections.at(-1)?.items[0].id).toBe('b');
  });

  it('группа выводится из категории, если productGroup не задан', () => {
    // старые данные без productGroup — секция должна определиться по category
    const items = [item({ id: 'a', category: 'fragrance' })];
    expect(buildShelfSections(items)[0].title).toBe('Ароматы');
  });

  it('пустой список — без секций', () => {
    expect(buildShelfSections([])).toEqual([]);
  });
});
