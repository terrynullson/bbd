import type { AddProductInput } from '../types';

/** Откуда пришли данные товара — показываем, чтобы пользователь мог их перепроверить. */
export function getLookupSourceLabel(
  source: AddProductInput['lookupSource'],
): string | null {
  switch (source) {
    case 'catalog':
      return 'Данные из каталога';
    case 'open-beauty-facts':
      return 'Данные из Open Beauty Facts';
    case 'barcode':
      return 'Данные по штрих-коду';
    case 'ai':
    case 'ai-barcode':
      return 'Данные подобраны ИИ';
    default:
      return null;
  }
}
