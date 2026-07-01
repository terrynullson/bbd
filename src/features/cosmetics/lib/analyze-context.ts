import type { AnalyzeProductRequest } from '../types';

export const UNKNOWN_BRAND = 'Неизвестный бренд';

export function isUnknownBrand(value: string | undefined): boolean {
  return !value?.trim() || value.trim() === UNKNOWN_BRAND;
}

export function hasAnalyzeInput(input: AnalyzeProductRequest): boolean {
  return Boolean(
    input.brand?.trim() || input.name?.trim() || input.barcode?.trim(),
  );
}

export function buildAnalyzeContext(input: AnalyzeProductRequest): string {
  const lines: string[] = ['Черновик пользователя:'];

  if (input.brand?.trim()) {
    lines.push(`- Бренд: ${input.brand.trim()}`);
  }
  if (input.name?.trim()) {
    lines.push(`- Название: ${input.name.trim()}`);
  }
  if (input.barcode?.trim()) {
    lines.push(`- Штрих-код: ${input.barcode.trim()}`);
  }

  lines.push(
    '',
    'Нормализуй опечатки и транслит, дополни короткие названия и верни структурированные данные о продукте.',
  );

  return lines.join('\n');
}
