import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { ProductSuggestion } from '../types';

type SuggestOptions = {
  type: 'brand' | 'product';
  query: string;
  brand?: string;
};

export async function fetchProductSuggestions({
  type,
  query,
  brand,
}: SuggestOptions): Promise<ProductSuggestion[]> {
  try {
    const params = new URLSearchParams({ type, q: query });
    if (brand) params.set('brand', brand);

    const headers: HeadersInit = {};
    const supabase = await getSupabaseBrowserClient();
    const { data } = supabase
      ? await supabase.auth.getSession()
      : { data: { session: null } };

    if (data.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }

    const response = await fetch(`/api/products/suggest?${params}`, { headers });
    if (!response.ok) return [];

    const payload = (await response.json()) as {
      suggestions?: ProductSuggestion[];
    };

    return payload.suggestions ?? [];
  } catch {
    return [];
  }
}
