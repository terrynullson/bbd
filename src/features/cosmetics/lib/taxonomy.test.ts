import { describe, expect, it } from 'vitest';
import { inferCategoryFromText } from './categories';
import {
  CATEGORY_LABELS,
  getDefaultPaoMonths,
  getSubtypeLabel,
  inferTaxonomy,
  normalizeCategory,
} from './taxonomy';
import type { CosmeticItem } from '../types';

describe('normalizeCategory', () => {
  it('старые slug-и остаются валидными', () => {
    for (const slug of ['cream', 'serum', 'toner', 'cleanser', 'mask', 'other']) {
      expect(normalizeCategory(slug)).toBe(slug);
    }
  });

  it('новые категории проходят', () => {
    expect(normalizeCategory('suncare')).toBe('suncare');
    expect(normalizeCategory('fragrance')).toBe('fragrance');
  });

  it('мусор и пустое → other', () => {
    expect(normalizeCategory('нечто')).toBe('other');
    expect(normalizeCategory(null)).toBe('other');
    expect(normalizeCategory(undefined)).toBe('other');
  });
});

describe('inferCategoryFromText — новые категории', () => {
  const cases: Array<[string, string]> = [
    ['Санскрин SPF 50', 'suncare'],
    ['Солнцезащитный крем', 'suncare'],
    ['Туалетная вода Chanel', 'fragrance'],
    ['Духи вечерние', 'fragrance'],
    ['Тушь для ресниц', 'makeup'],
    ['Помада матовая', 'makeup'],
    ['Тональный крем', 'makeup'],
    ['Шампунь для волос', 'hair'],
    ['Кондиционер', 'hair'],
    ['Крем для рук', 'body'],
    ['Гель для душа', 'body'],
    ['Дезодорант', 'body'],
    ['Лак для ногтей', 'nails'],
    ['Сыворотка с витамином C', 'serum'],
    ['Тоник увлажняющий', 'toner'],
    ['Пенка для умывания', 'cleanser'],
    ['Тканевая маска', 'mask'],
    ['Ночной крем', 'cream'],
  ];

  it.each(cases)('%s → %s', (text, expected) => {
    expect(inferCategoryFromText(text)).toBe(expected);
  });

  it('порядок частное→общее: «крем для рук» не уходит в cream', () => {
    expect(inferCategoryFromText('Крем для рук питательный')).toBe('body');
  });

  it('«маска для волос» — это hair, а не mask', () => {
    expect(inferCategoryFromText('Маска для волос восстанавливающая')).toBe('hair');
  });
});

describe('inferTaxonomy + PAO по подтипу', () => {
  it('тушь — 3 месяца (безопасность глаз), а не общий makeup', () => {
    const t = inferTaxonomy('makeup', 'Тушь для ресниц');
    expect(t.subtype).toBe('mascara');
    expect(getDefaultPaoMonths(t.subtype, 'makeup')).toBe(3);
  });

  it('помада — 12', () => {
    const t = inferTaxonomy('makeup', 'Помада матовая');
    expect(t.subtype).toBe('lipstick');
    expect(getDefaultPaoMonths(t.subtype, 'makeup')).toBe(12);
  });

  it('парфюм — 24', () => {
    const t = inferTaxonomy('fragrance', 'Туалетная вода');
    expect(getDefaultPaoMonths(t.subtype, 'fragrance')).toBe(24);
  });

  it('сыворотка — 6', () => {
    const t = inferTaxonomy('serum', 'Сыворотка');
    expect(getDefaultPaoMonths(t.subtype, 'serum')).toBe(6);
  });

  it('макияж без уточнения — категорийный дефолт 12 и ярлык категории', () => {
    const t = inferTaxonomy('makeup', 'Хайлайтер');
    expect(t.subtype).toBe('other');
    expect(t.label).toBe(CATEGORY_LABELS.makeup);
    expect(getDefaultPaoMonths(t.subtype, 'makeup')).toBe(12);
  });

  it('ночной крем даёт свой подтип и группу skincare', () => {
    const t = inferTaxonomy('cream', 'Ночной крем с ретинолом');
    expect(t.subtype).toBe('night_cream');
    expect(t.group).toBe('skincare');
  });
});

describe('getSubtypeLabel', () => {
  function item(overrides: Partial<CosmeticItem>): CosmeticItem {
    return {
      id: '1',
      name: 'X',
      brand: 'Y',
      paoMonths: 12,
      openedAt: '2026-01-01',
      status: 'fresh',
      category: 'other',
      createdAt: '2026-01-01',
      ...overrides,
    } as CosmeticItem;
  }

  it('конкретный подтип показывается как есть', () => {
    expect(getSubtypeLabel(item({ productSubtype: 'mascara' }))).toBe('Тушь');
  });

  it('общий подтип падает на ярлык категории', () => {
    expect(
      getSubtypeLabel(item({ productSubtype: 'other', category: 'makeup' })),
    ).toBe('Макияж');
  });
});
