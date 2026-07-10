import type { ProductCategory } from '../types';
import { getCategoryLabel } from './taxonomy';

export { CATEGORY_ORDER } from './taxonomy';

/** Подпись категории для чипов формы (тот же ярлык, что и на полке). */
export function getCategoryTitle(category: ProductCategory = 'other'): string {
  return getCategoryLabel(category);
}

// Порядок проверок — от частного к общему: «крем для рук» должен уйти в body,
// а не в cream; «маска для волос» — в hair, а не в mask.
export function inferCategoryFromText(text: string): ProductCategory {
  const lower = text.toLowerCase();

  if (/\bspf\b|санскрин|солнцезащит|sunscreen|автозагар|self[-\s]?tan/i.test(lower))
    return 'suncare';
  if (/парфюм|духи|туалетн(ая|ой)\s*вод|одеколон|perfume|eau de|cologne/i.test(lower))
    return 'fragrance';
  if (/лак.*ногт|ногт|nail/i.test(lower)) return 'nails';
  if (
    /тушь|помад|блеск.*губ|тональн|консилер|румян|хайлайтер|тени.*век|подводк|mascara|lipstick|foundation|concealer|blush|eyeshadow/i.test(
      lower,
    )
  )
    return 'makeup';
  if (/шампун|кондицион|для\s*волос|бальзам.*волос|shampoo|conditioner|\bhair\b/i.test(lower))
    return 'hair';
  if (
    /дезодор|антиперспир|для\s*рук|для\s*тела|гель.*душ|скраб.*тел|body\s*(lotion|wash|cream)|deodorant|hand\s*cream/i.test(
      lower,
    )
  )
    return 'body';
  if (/сыворотк|serum|ампул|niacinamide|эссенц/i.test(lower)) return 'serum';
  if (/тоник|toner|тонизирующ/i.test(lower)) return 'toner';
  if (/пенк|гель.*умыв|очищ|cleanser|мицелляр|makeup remover|демакияж/i.test(lower))
    return 'cleanser';
  if (/маск|mask|патч/i.test(lower)) return 'mask';
  if (/крем|лосьон|cream|moistur|эмульси/i.test(lower)) return 'cream';

  return 'other';
}
