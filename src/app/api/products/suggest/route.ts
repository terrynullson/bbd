import { NextRequest, NextResponse } from 'next/server';
import { normalizeSearchText } from '@/features/cosmetics/lib/normalize';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { ProductSuggestion } from '@/features/cosmetics/types';

const SUGGEST_LIMIT = 8;

type SuggestType = 'brand' | 'product';

type BrandRow = {
  id: string;
  name: string;
};

type CatalogRow = {
  id: string;
  brand: string;
  name: string;
  barcode: string | null;
  default_pao_months: number | null;
  category: ProductSuggestion['category'];
  image_url: string | null;
};

type UserProductRow = {
  id: string;
  brand: string;
  name: string;
  barcode: string | null;
  pao_months: number;
  category: ProductSuggestion['category'];
  image_url: string | null;
};

function getBearerToken(request: NextRequest) {
  const header = request.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1];
}

function dedupeSuggestions(items: ProductSuggestion[]) {
  const seen = new Set<string>();
  const result: ProductSuggestion[] = [];

  for (const item of items) {
    const key = normalizeSearchText(`${item.brand ?? ''} ${item.name}`);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }

  return result.slice(0, SUGGEST_LIMIT);
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim() ?? '';
  const type = (request.nextUrl.searchParams.get('type') ?? 'product') as SuggestType;
  const brand = request.nextUrl.searchParams.get('brand')?.trim() ?? '';
  const normalizedQ = normalizeSearchText(q);

  if (normalizedQ.length < 2 || !['brand', 'product'].includes(type)) {
    return NextResponse.json({ suggestions: [] });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ suggestions: [] });
  }

  const suggestions: ProductSuggestion[] = [];

  if (type === 'brand') {
    const { data } = await supabase
      .from('brand_catalog')
      .select('id,name')
      .ilike('normalized_name', `${normalizedQ}%`)
      .order('usage_count', { ascending: false })
      .limit(SUGGEST_LIMIT);

    suggestions.push(
      ...((data ?? []) as BrandRow[]).map((row) => ({
        id: row.id,
        name: row.name,
        source: 'catalog' as const,
      })),
    );
  } else {
    let query = supabase
      .from('product_catalog')
      .select('id,brand,name,barcode,default_pao_months,category,image_url')
      .or(`normalized_name.ilike.${normalizedQ}%,normalized_brand.ilike.${normalizedQ}%`)
      .order('usage_count', { ascending: false })
      .limit(SUGGEST_LIMIT);

    const normalizedBrand = normalizeSearchText(brand);
    if (normalizedBrand.length >= 2) {
      query = query.ilike('normalized_brand', `${normalizedBrand}%`);
    }

    const { data } = await query;

    suggestions.push(
      ...((data ?? []) as CatalogRow[]).map((row) => ({
        id: row.id,
        brand: row.brand,
        name: row.name,
        barcode: row.barcode ?? undefined,
        paoMonths: row.default_pao_months ?? undefined,
        category: row.category,
        imageUrl: row.image_url ?? undefined,
        source: 'catalog' as const,
      })),
    );
  }

  const authToken = getBearerToken(request);
  if (authToken) {
    const userClient = getSupabaseServerClient({ authToken });
    const userResponse = userClient
      ? type === 'brand'
        ? await userClient
            .from('user_products')
            .select('id,brand,name,barcode,pao_months,category,image_url')
            .ilike('brand', `${q}%`)
            .is('deleted_at', null)
            .limit(SUGGEST_LIMIT)
        : await userClient
            .from('user_products')
            .select('id,brand,name,barcode,pao_months,category,image_url')
            .or(`name.ilike.%${q}%,brand.ilike.%${q}%`)
            .is('deleted_at', null)
            .limit(SUGGEST_LIMIT)
      : { data: [] };

    suggestions.unshift(
      ...((userResponse.data ?? []) as UserProductRow[]).map((row) => ({
        id: row.id,
        brand: type === 'brand' ? undefined : row.brand,
        name: type === 'brand' ? row.brand : row.name,
        barcode: row.barcode ?? undefined,
        paoMonths: row.pao_months,
        category: row.category,
        imageUrl: row.image_url ?? undefined,
        source: 'personal' as const,
      })),
    );
  }

  return NextResponse.json({ suggestions: dedupeSuggestions(suggestions) });
}
