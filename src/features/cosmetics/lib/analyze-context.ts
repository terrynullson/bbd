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

export function parseAnalyzeRequest(body: unknown): AnalyzeProductRequest {
  if (!body || typeof body !== 'object') return {};

  const record = body as Record<string, unknown>;
  const brand = typeof record.brand === 'string' ? record.brand.trim() : '';
  const name = typeof record.name === 'string' ? record.name.trim() : '';
  const barcode =
    typeof record.barcode === 'string' ? record.barcode.trim() : '';
  const query = typeof record.query === 'string' ? record.query.trim() : '';

  if (brand || name || barcode) {
    return {
      brand: brand || undefined,
      name: name || undefined,
      barcode: barcode || undefined,
    };
  }

  // Совместимость со старым клиентом, который отправлял только query.
  if (query) {
    return { name: query };
  }

  return {};
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
    lines.push(
      '',
      'По штрих-коду определи бренд и название косметического продукта. Если код неизвестен, предложи наиболее вероятный продукт.',
    );
  }

  if (!input.barcode?.trim()) {
    lines.push(
      '',
      'Нормализуй опечатки и транслит, дополни короткие названия и верни структурированные данные о продукте.',
    );
  }

  return lines.join('\n');
}
