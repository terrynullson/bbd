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

// Полный маппинг 36 типов из CSV в 12 категорий приложения.
const TYPE_TO_CATEGORY = {
  Serum: 'serum',
  'Facial Treatment': 'serum',
  Oil: 'serum',
  Toner: 'toner',
  Essence: 'toner',
  'Face Cleanser': 'cleanser',
  Exfoliator: 'cleanser',
  'Makeup Remover': 'cleanser',
  'General Moisturizer': 'cream',
  'Day Moisturizer': 'cream',
  'Night Moisturizer': 'cream',
  'Eye Moisturizer': 'cream',
  Emulsion: 'cream',
  Mask: 'mask',
  'Wet Mask': 'mask',
  'Sheet Mask': 'mask',
  'Overnight Mask': 'mask',
  'Eye Mask': 'mask',
  'Lip Mask': 'mask',
  Sunscreen: 'suncare',
  Tanning: 'suncare',
  'Face Makeup': 'makeup',
  'Eye Makeup': 'makeup',
  'Lip Makeup': 'makeup',
  'Cheek Makeup': 'makeup',
  Shampoo: 'hair',
  Conditioner: 'hair',
  'Other Haircare': 'hair',
  'Bath & Body': 'body',
  'Hand Care': 'body',
  'Lip Moisturizer': 'body',
  Fragrance: 'fragrance',
  'Nail Care': 'nails',
  Tool: 'other',
  'Makeup Applicator': 'other',
  'False Eyelash': 'other',
  Other: 'other',
};

// Категорийный дефолт PAO (в месяцах) — совпадает с CATEGORY_PAO_MONTHS приложения.
const CATEGORY_PAO_MONTHS = {
  cleanser: 12,
  toner: 12,
  serum: 6,
  cream: 12,
  mask: 6,
  suncare: 12,
  makeup: 12,
  hair: 12,
  body: 12,
  fragrance: 24,
  nails: 24,
  other: 12,
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
  if (/spf|sunscreen|солнцезащит|санскрин|tanning/i.test(lower)) return 'suncare';
  if (/perfume|fragrance|eau de|духи|парфюм|одеколон/i.test(lower)) return 'fragrance';
  if (/nail|ногт|лак/i.test(lower)) return 'nails';
  if (/mascara|lipstick|foundation|makeup|тушь|помад|тональн/i.test(lower)) return 'makeup';
  if (/shampoo|conditioner|hair|шампун|кондицион|волос/i.test(lower)) return 'hair';
  if (/body|deodorant|hand|дезодор|для тела|для рук/i.test(lower)) return 'body';
  if (/сыворотк|serum|ампул|niacinamide|эссенц/i.test(lower)) return 'serum';
  if (/тоник|toner/i.test(lower)) return 'toner';
  if (/пенк|гель.*умыв|cleanser|мицелляр|remover/i.test(lower)) return 'cleanser';
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
      // confidence/usage_count намеренно не задаём: при пере-сиде upsert их
      // не перезапишет (растут от реального использования), новые строки
      // получат дефолты БД.
      byKey.set(key, {
        barcode: null,
        brand,
        name,
        normalized_brand,
        normalized_name,
        category,
        default_pao_months: CATEGORY_PAO_MONTHS[category] ?? 12,
        source,
      });
    }
  }

  return [...byKey.values()];
}

// Upsert по (normalized_brand, normalized_name): пере-сид обновляет
// category и default_pao_months у существующих строк, а не плодит дубли
// (прежний insert их просто пропускал, и категории не обновлялись).
async function insertBatch(supabase, rows) {
  const { error } = await supabase
    .from('product_catalog')
    .upsert(rows, { onConflict: 'normalized_brand,normalized_name' });

  if (error) throw error;

  return { inserted: rows.length, skipped: 0 };
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
