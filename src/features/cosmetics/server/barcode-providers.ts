import { inferCategoryFromText } from '../lib/categories';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import type { LookupProductResponse } from '../types';

type BarcodeProvider = {
  id: string;
  lookup: (barcode: string) => Promise<LookupProductResponse>;
};

const OPEN_BEAUTY_FACTS_URL = 'https://world.openbeautyfacts.org/api/v2/product';
const LOOKUP_FIELDS = [
  'code',
  'product_name',
  'brands',
  'categories_tags',
  'periods_after_opening',
].join(',');

type OpenBeautyFactsProduct = {
  code?: string;
  product_name?: string;
  brands?: string;
  categories_tags?: string[];
  periods_after_opening?: string | string[];
};

type OpenBeautyFactsResponse = {
  status?: number;
  product?: OpenBeautyFactsProduct;
};

function parsePaoMonths(value: OpenBeautyFactsProduct['periods_after_opening']) {
  const raw = Array.isArray(value) ? value.join(' ') : value;
  if (!raw) return undefined;

  const match = raw.match(/(\d{1,2})\s*(m|mo|month|months|месяц|мес)/i);
  if (!match) return undefined;

  const months = Number(match[1]);
  return Number.isFinite(months) && months > 0 ? months : undefined;
}

function normalizeOpenBeautyFactsProduct(
  barcode: string,
  product?: OpenBeautyFactsProduct,
): LookupProductResponse {
  const brand = product?.brands?.split(',')[0]?.trim();
  const name = product?.product_name?.trim();

  if (!brand && !name) {
    return { found: false, barcode };
  }

  const categoryText = [
    name,
    brand,
    ...(product?.categories_tags ?? []),
  ].join(' ');

  return {
    found: true,
    barcode: product?.code ?? barcode,
    brand,
    name,
    paoMonths: parsePaoMonths(product?.periods_after_opening),
    category: inferCategoryFromText(categoryText),
    categoriesTags: product?.categories_tags,
    source: 'open-beauty-facts',
  };
}

const catalogProvider: BarcodeProvider = {
  id: 'catalog',
  async lookup(barcode) {
    const supabase = getSupabaseServerClient({ serviceRole: true });
    if (!supabase) return { found: false, barcode };

    const { data } = await supabase
      .from('product_catalog')
      .select('brand,name,barcode,default_pao_months,category,image_url')
      .eq('barcode', barcode)
      .limit(1)
      .maybeSingle();

    if (!data?.brand && !data?.name) {
      return { found: false, barcode };
    }

    return {
      found: true,
      barcode: data.barcode ?? barcode,
      brand: data.brand,
      name: data.name,
      paoMonths: data.default_pao_months ?? undefined,
      category: data.category ?? inferCategoryFromText(`${data.brand} ${data.name}`),
      imageUrl: data.image_url ?? undefined,
      source: 'catalog',
    };
  },
};

const openBeautyFactsProvider: BarcodeProvider = {
  id: 'open-beauty-facts',
  async lookup(barcode) {
    const response = await fetch(
      `${OPEN_BEAUTY_FACTS_URL}/${barcode}.json?fields=${LOOKUP_FIELDS}`,
      {
        headers: {
          'User-Agent': 'GdeMoyKrem/1.0 (https://bbd-amber.vercel.app)',
        },
        next: { revalidate: 60 * 60 * 24 },
      },
    );

    if (!response.ok) return { found: false, barcode };

    const data = (await response.json()) as OpenBeautyFactsResponse;
    if (data.status !== 1) return { found: false, barcode };

    return normalizeOpenBeautyFactsProduct(barcode, data.product);
  },
};

function disabledRegionalProvider(id: string): BarcodeProvider {
  return {
    id,
    async lookup(barcode) {
      return { found: false, barcode };
    },
  };
}

const providers: BarcodeProvider[] = [
  catalogProvider,
  openBeautyFactsProvider,
  disabledRegionalProvider('ru-chestny-znak-or-commercial'),
  disabledRegionalProvider('kr-gs1-koreannet'),
  disabledRegionalProvider('cn-commercial-barcode'),
];

export async function lookupBarcodeWithProviders(barcode: string) {
  for (const provider of providers) {
    const result = await provider.lookup(barcode);
    if (result.found) return result;
  }

  return { found: false, barcode };
}
