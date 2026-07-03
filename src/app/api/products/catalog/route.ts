import { NextRequest, NextResponse } from 'next/server';
import {
  canonicalizeBrand,
  canonicalizeProductName,
} from '@/features/cosmetics/lib/canonicalize-product-name';
import { normalizeSearchText, isUsefulCatalogValue } from '@/features/cosmetics/lib/normalize';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { BarcodeSource, BarcodeTrust, ProductCategory } from '@/features/cosmetics/types';

type CatalogPayload = {
  brand?: string;
  name?: string;
  barcode?: string;
  category?: ProductCategory;
  paoMonths?: number;
  imageUrl?: string;
  source?: string;
  barcodeTrust?: BarcodeTrust;
  barcodeSource?: BarcodeSource;
};

type ExistingProduct = {
  id: string;
  usage_count: number;
};

async function upsertBrand(name: string, source: string) {
  const supabase = getSupabaseServerClient({ serviceRole: true });
  if (!supabase) return;

  const normalized = normalizeSearchText(name);
  const { data } = await supabase
    .from('brand_catalog')
    .select('id,usage_count')
    .eq('normalized_name', normalized)
    .maybeSingle();

  if (data) {
    await supabase
      .from('brand_catalog')
      .update({
        name,
        source,
        usage_count: (data.usage_count ?? 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id);
    return;
  }

  await supabase.from('brand_catalog').insert({
    name,
    normalized_name: normalized,
    source,
  });
}

function resolveConfidence(source: string, barcodeTrust?: BarcodeTrust) {
  if (barcodeTrust === 'suspicious') return 0.2;
  if (barcodeTrust === 'unverified') return 0.45;
  if (source === 'open-beauty-facts') return 0.9;
  if (source === 'catalog') return 0.85;
  return 0.65;
}

export async function POST(request: NextRequest) {
  const supabase = getSupabaseServerClient({ serviceRole: true });
  if (!supabase) {
    return NextResponse.json({ ok: true, skipped: 'supabase-not-configured' });
  }

  const body = (await request.json()) as CatalogPayload;
  const brand = canonicalizeBrand(body.brand?.trim() ?? '');
  const name = canonicalizeProductName(body.name?.trim() ?? '');

  if (!isUsefulCatalogValue(brand) || !isUsefulCatalogValue(name)) {
    return NextResponse.json({ ok: true, skipped: 'weak-product' });
  }

  const source = body.source ?? 'manual';
  const normalizedBrand = normalizeSearchText(brand);
  const normalizedName = normalizeSearchText(name);
  const barcodeTrust = body.barcodeTrust;
  const barcode =
    body.barcode?.trim() && barcodeTrust !== 'suspicious'
      ? body.barcode.trim()
      : null;
  const now = new Date().toISOString();

  await upsertBrand(brand, source);

  const existingQuery = supabase
    .from('product_catalog')
    .select('id,usage_count')
    .limit(1);

  const { data: existingData } = barcode
    ? await existingQuery.eq('barcode', barcode).maybeSingle()
    : await existingQuery
        .eq('normalized_brand', normalizedBrand)
        .eq('normalized_name', normalizedName)
        .maybeSingle();

  const existing = existingData as ExistingProduct | null;

  const catalogData = {
    barcode,
    brand,
    name,
    normalized_brand: normalizedBrand,
    normalized_name: normalizedName,
    category: body.category ?? 'other',
    default_pao_months: body.paoMonths,
    image_url: body.imageUrl ?? null,
    source,
    barcode_trust: barcodeTrust ?? null,
    barcode_source: body.barcodeSource ?? null,
    confidence: resolveConfidence(source, barcodeTrust),
    updated_at: now,
    last_seen_at: now,
  };

  if (existing) {
    const { error } = await supabase
      .from('product_catalog')
      .update({
        ...catalogData,
        usage_count: (existing.usage_count ?? 0) + 1,
      })
      .eq('id', existing.id);

    if (error) throw error;
    return NextResponse.json({ ok: true, updated: true });
  }

  const { error } = await supabase.from('product_catalog').insert(catalogData);
  if (error) throw error;

  return NextResponse.json({ ok: true, inserted: true });
}
