import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { requireSupabaseServiceEnv } from './lib/env.mjs';
import { loadCsvBrandNames, resolveProductsCsvPath } from './lib/csv.mjs';
import {
  canonicalizeBrand,
  isUsefulCatalogValue,
  normalizeSearchText,
} from './lib/normalize.mjs';

const BATCH_SIZE = 500;
const SOURCE_PRIORITY = {
  incidecoder: 2,
  goldapple: 1,
  manual: 0,
};

function resolveBrandsPath() {
  if (process.env.SEED_BRANDS_PATH) {
    return resolve(process.env.SEED_BRANDS_PATH);
  }

  const candidates = [
    resolve(process.cwd(), 'data/seed/brands.json'),
    resolve(process.cwd(), '../parser_brands/supabase_brands.json'),
  ];

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  return null;
}

function loadRawBrands(path) {
  const payload = JSON.parse(readFileSync(path, 'utf8'));
  if (!Array.isArray(payload)) {
    throw new Error(`Ожидался JSON-массив в ${path}`);
  }
  return payload;
}

function isJunkBrand(name) {
  if (!name || name.length < 2) return true;
  if (name.includes('!')) return true;
  if (/^["']/.test(name)) return true;
  return false;
}

function addBrandCandidate(byNormalized, rawName, source) {
  if (typeof rawName !== 'string') return;

  const name = canonicalizeBrand(rawName);
  if (!isUsefulCatalogValue(name) || isJunkBrand(name)) return;

  const normalized_name = normalizeSearchText(name);
  if (!normalized_name) return;

  const candidate = {
    name,
    normalized_name,
    source,
    usage_count: 0,
  };

  const existing = byNormalized.get(normalized_name);
  if (!existing) {
    byNormalized.set(normalized_name, candidate);
    return;
  }

  const existingPriority = SOURCE_PRIORITY[existing.source] ?? 0;
  const candidatePriority = SOURCE_PRIORITY[source] ?? 0;

  if (
    candidatePriority > existingPriority ||
    (candidatePriority === existingPriority && name.length > existing.name.length)
  ) {
    byNormalized.set(normalized_name, candidate);
  }
}

function prepareBrands(entries) {
  const byNormalized = new Map();

  for (const entry of entries) {
    addBrandCandidate(byNormalized, entry.rawName, entry.source);
  }

  return [...byNormalized.values()];
}

function collectBrandEntries() {
  const entries = [];
  const brandsPath = resolveBrandsPath();
  const productsPath = resolveProductsCsvPath();

  if (brandsPath) {
    const rawBrands = loadRawBrands(brandsPath);
    entries.push(
      ...rawBrands.map((rawName) => ({
        rawName,
        source: process.env.SEED_BRANDS_SOURCE ?? 'goldapple',
      })),
    );
    console.log(`Gold Apple: ${rawBrands.length} из ${brandsPath}`);
  }

  if (productsPath) {
    const csvBrands = loadCsvBrandNames(productsPath);
    entries.push(
      ...csvBrands.map((rawName) => ({
        rawName,
        source: process.env.SEED_PRODUCTS_SOURCE ?? 'incidecoder',
      })),
    );
    console.log(`INCIDecoder CSV: ${csvBrands.length} уникальных брендов из ${productsPath}`);
  }

  if (entries.length === 0) {
    throw new Error(
      'Не найдены источники брендов. Нужен supabase_brands.json и/или datasheet.csv',
    );
  }

  return entries;
}

async function insertBatch(supabase, rows) {
  const { error } = await supabase.from('brand_catalog').upsert(rows, {
    onConflict: 'normalized_name',
    ignoreDuplicates: true,
  });

  if (error) throw error;
}

async function refreshBrandNames(supabase, rows) {
  if (process.env.SKIP_BRAND_REFRESH === '1') {
    console.log('Пропуск обновления названий (SKIP_BRAND_REFRESH=1)');
    return 0;
  }

  const preferred = rows.filter((row) => row.source === 'incidecoder');
  const chunkSize = 25;
  let updated = 0;

  for (let i = 0; i < preferred.length; i += chunkSize) {
    const chunk = preferred.slice(i, i + chunkSize);
    const results = await Promise.all(
      chunk.map((row) =>
        supabase
          .from('brand_catalog')
          .update({
            name: row.name,
            source: row.source,
            updated_at: new Date().toISOString(),
          })
          .eq('normalized_name', row.normalized_name)
          .select('id'),
      ),
    );

    for (const { data, error } of results) {
      if (error) throw error;
      updated += data?.length ?? 0;
    }
  }

  return updated;
}

async function main() {
  const entries = collectBrandEntries();
  const brands = prepareBrands(entries);

  console.log(`К загрузке после очистки и слияния: ${brands.length}`);

  const { url, serviceRoleKey } = requireSupabaseServiceEnv();
  const supabase = createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let inserted = 0;
  for (let i = 0; i < brands.length; i += BATCH_SIZE) {
    const batch = brands.slice(i, i + BATCH_SIZE);
    await insertBatch(supabase, batch);
    inserted += batch.length;
    console.log(`Загружено: ${inserted}/${brands.length}`);
  }

  const refreshed = await refreshBrandNames(supabase, brands);
  console.log(`Обновлено канонических названий (incidecoder): ${refreshed}`);

  const { count, error: countError } = await supabase
    .from('brand_catalog')
    .select('*', { count: 'exact', head: true });

  if (countError) throw countError;

  console.log(`Готово. В brand_catalog сейчас: ${count ?? '?'}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
