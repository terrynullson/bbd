import {
  buildAnalyzeQuery,
  mergeAnalyzeResult,
} from '../lib/merge-analyze';
import type {
  AnalyzeProductRequest,
  AnalyzeProductResponse,
} from '../types';

export async function analyzeProduct(
  input: AnalyzeProductRequest,
): Promise<AnalyzeProductResponse> {
  const query = buildAnalyzeQuery(input);

  if (!query.trim()) {
    throw new Error('Введите название или бренд для анализа');
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...input, query }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || 'Не удалось получить ответ от ИИ');
  }

  return mergeAnalyzeResult(input, data as AnalyzeProductResponse);
}
