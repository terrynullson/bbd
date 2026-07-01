import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { LookupProductResponse } from '../types';

export async function lookupProductByBarcode(
  barcode: string,
): Promise<LookupProductResponse> {
  const normalizedBarcode = barcode.trim();

  if (!normalizedBarcode) {
    throw new Error('Штрих-код не найден');
  }

  const headers: HeadersInit = {};
  const supabase = getSupabaseBrowserClient();
  const { data: sessionData } = supabase
    ? await supabase.auth.getSession()
    : { data: { session: null } };

  if (sessionData.session?.access_token) {
    headers.Authorization = `Bearer ${sessionData.session.access_token}`;
  }

  const response = await fetch(
    `/api/products/lookup?barcode=${encodeURIComponent(normalizedBarcode)}`,
    { headers },
  );
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data?.error || 'Не удалось проверить штрих-код');
  }

  return data as LookupProductResponse;
}
