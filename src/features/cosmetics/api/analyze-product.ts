import {
  hasAnalyzeInput,
} from '../lib/analyze-context';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
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

  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const supabase = await getSupabaseBrowserClient();
  const { data: sessionData } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null } };

  if (sessionData.session?.access_token) {
    headers.Authorization = `Bearer ${sessionData.session.access_token}`;
  }

  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || 'Не удалось получить ответ от ИИ');
  }

  return data as AnalyzeProductResponse;
}
