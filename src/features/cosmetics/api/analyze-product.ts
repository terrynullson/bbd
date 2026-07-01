import {
  hasAnalyzeInput,
} from '../lib/analyze-context';
import type {
  AnalyzeProductRequest,
  AnalyzeProductResponse,
} from '../types';

export async function analyzeProduct(
  input: AnalyzeProductRequest,
): Promise<AnalyzeProductResponse> {
  const payload: AnalyzeProductRequest = {
    brand: input.brand?.trim() || undefined,
    name: input.name?.trim() || undefined,
    barcode: input.barcode?.trim() || undefined,
  };

  if (!hasAnalyzeInput(payload)) {
    throw new Error('Введите бренд или название для анализа');
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || 'Не удалось получить ответ от ИИ');
  }

  return data as AnalyzeProductResponse;
}
