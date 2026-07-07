import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';
import { requireSupabaseServiceEnv } from './lib/env.mjs';
import { parseCsv, resolveProductsCsvPath } from './lib/csv.mjs';
import {
  canonicalizeBrand,
  canonicalizeProductName,
  isUsefulCatalogValue,
  normalizeSearchText,
} from './lib/normalize.mjs';

const BATCH_SIZE = 300;
const DEFAULT_SOURCE = 'incidecoder';

const TYPE_TO_CATEGORY = {
  Serum: 'serum',
  Toner: 'toner',
  'Face Cleanser': 'cleanser',
  'General Moisturizer': 'cream',
  'Day Moisturizer': 'cream',
  'Night Moisturizer': 'cream',
  Mask: 'mask',
  'Facial Treatment': 'serum',
};

function resolveProductsPath() {
  const path = resolveProductsCsvPath();
  if (!path) {
    throw new Error(
      'Не найден CSV продуктов. Укажите SEED_PRODUCTS_PATH или положите data/seed/products.csv',
    );
  }
  return path;
}

function inferCategoryFromType(type, text) {
  if (TYPE_TO_CATEGORY[type]) return TYPE_TO_CATEGORY[type];

  const lower = text.toLowerCase();
  if (/сыворотк|serum|ампул|niacinamide/i.test(lower)) return 'serum';
  if (/тоник|toner|эссенц/i.test(lower)) return 'toner';
  if (/пенк|гель.*умыв|cleanser|мицелляр/i.test(lower)) return 'cleanser';
  if (/маск|mask|патч/i.test(lower)) return 'mask';
  if (/крем|лосьон|cream|moistur/i.test(lower)) return 'cream';

  return 'other';
}

function prepareProducts(csvRows, source = DEFAULT_SOURCE) {
  if (csvRows.length < 2) return [];

  const header = csvRows[0].map((cell) => cell.trim());
  const brandIdx = header.indexOf('brand');
  const nameIdx = header.indexOf('name');
  const typeIdx = header.indexOf('type');

  if (brandIdx < 0 || nameIdx < 0) {
    throw new Error('CSV должен содержать колонки brand и name');
  }

  const byKey = new Map();

  for (const row of csvRows.slice(1)) {
    const rawBrand = row[brandIdx]?.trim() ?? '';
    const rawName = row[nameIdx]?.trim() ?? '';
    const type = typeIdx >= 0 ? row[typeIdx]?.trim() ?? '' : '';

    const brand = canonicalizeBrand(rawBrand);
    const name = canonicalizeProductName(rawName);

    if (!isUsefulCatalogValue(brand) || !isUsefulCatalogValue(name)) continue;

    const normalized_brand = normalizeSearchText(brand);
    const normalized_name = normalizeSearchText(name);
    const key = `${normalized_brand}::${normalized_name}`;
    const category = inferCategoryFromType(type, `${brand} ${name} ${type}`);

    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, {
        barcode: null,
        brand,
        name,
        normalized_brand,
        normalized_name,
        category,
        source,
        confidence: 0.7,
        usage_count: 0,
      });
    }
  }

  return [...byKey.values()];
}

async function insertBatch(supabase, rows) {
  const { error } = await supabase.from('product_catalog').insert(rows);

  if (!error) {
    return { inserted: rows.length, skipped: 0 };
  }

  if (error.code !== '23505') {
    throw error;
  }

  let inserted = 0;
  let skipped = 0;

  for (const row of rows) {
    const { error: rowError } = await supabase.from('product_catalog').insert(row);

    if (rowError?.code === '23505') {
      skipped += 1;
      continue;
    }

    if (rowError) throw rowError;
    inserted += 1;
  }

  return { inserted, skipped };
}

async function main() {
  const productsPath = resolveProductsPath();
  const source = process.env.SEED_PRODUCTS_SOURCE ?? DEFAULT_SOURCE;
  const csvRows = parseCsv(readFileSync(productsPath, 'utf8'));
  const products = prepareProducts(csvRows, source);

  console.log(`Файл: ${productsPath}`);
  console.log(`Строк в CSV: ${Math.max(csvRows.length - 1, 0)}`);
  console.log(`К загрузке после дедупа: ${products.length}`);

  const { url, serviceRoleKey } = requireSupabaseServiceEnv();
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let inserted = 0;
  let skipped = 0;

  for (let i = 0; i < products.length; i += BATCH_SIZE) {
    const batch = products.slice(i, i + BATCH_SIZE);
    const result = await insertBatch(supabase, batch);
    inserted += result.inserted;
    skipped += result.skipped;
    console.log(
      `Обработано: ${Math.min(i + BATCH_SIZE, products.length)}/${products.length} (новых: ${inserted}, пропущено: ${skipped})`,
    );
  }

  const { count, error: countError } = await supabase
    .from('product_catalog')
    .select('*', { count: 'exact', head: true });

  if (countError) throw countError;

  console.log(`Готово. В product_catalog сейчас: ${count ?? '?'}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
