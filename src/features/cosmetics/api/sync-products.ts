import type { SupabaseClient } from '@supabase/supabase-js';
import { calculateStatus } from '../lib/calculate-status';
import type { CosmeticItem } from '../types';
import { waitForAuthSession, withSyncRetry } from './sync-retry';

type ProductRow = {
  id: string;
  user_id: string;
  brand: string;
  name: string;
  category: CosmeticItem['category'];
  opened_at: string;
  pao_months: number;
  barcode: string | null;
  image_url: string | null;
  notes: string | null;
  source: CosmeticItem['lookupSource'] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  client_updated_at: string;
};

function toRow(item: CosmeticItem, userId: string): ProductRow {
  return {
    id: item.id,
    user_id: userId,
    brand: item.brand,
    name: item.name,
    category: item.category ?? 'other',
    opened_at: item.openedAt,
    pao_months: item.paoMonths,
    barcode: item.barcode ?? null,
    image_url:
      item.imageUrl && !item.imageUrl.startsWith('data:')
        ? item.imageUrl
        : null,
    notes: item.notes ?? null,
    source: item.lookupSource ?? 'manual',
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    deleted_at: item.deletedAt ?? null,
    client_updated_at: item.updatedAt,
  };
}

function fromRow(row: ProductRow): CosmeticItem {
  return {
    id: row.id,
    brand: row.brand,
    name: row.name,
    category: row.category ?? 'other',
    openedAt: row.opened_at,
    paoMonths: row.pao_months,
    barcode: row.barcode ?? undefined,
    imageUrl: row.image_url ?? undefined,
    notes: row.notes ?? undefined,
    lookupSource: row.source ?? 'manual',
    createdAt: row.created_at,
    updatedAt: row.client_updated_at ?? row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
    status: calculateStatus(row.opened_at, row.pao_months),
  };
}

export function mergeProducts(
  localItems: CosmeticItem[],
  cloudItems: CosmeticItem[],
) {
  const merged = new Map<string, CosmeticItem>();

  for (const item of [...cloudItems, ...localItems]) {
    const existing = merged.get(item.id);
    if (!existing) {
      merged.set(item.id, item);
      continue;
    }

    const existingTime = new Date(existing.updatedAt).getTime();
    const itemTime = new Date(item.updatedAt).getTime();
    if (itemTime >= existingTime) {
      merged.set(item.id, item);
    }
  }

  return [...merged.values()].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

async function assertAuthSession(supabase: SupabaseClient) {
  const session = await waitForAuthSession(supabase);
  if (!session) {
    throw new Error('auth session not ready');
  }
}

export async function fetchCloudProducts(supabase: SupabaseClient) {
  await assertAuthSession(supabase);

  return withSyncRetry('fetch', async () => {
    const { data, error } = await supabase
      .from('user_products')
      .select('*')
      .order('client_updated_at', { ascending: false })
      .limit(500);

    if (error) throw error;
    return ((data ?? []) as ProductRow[]).map(fromRow);
  });
}

export async function upsertCloudProducts(
  supabase: SupabaseClient,
  userId: string,
  items: CosmeticItem[],
) {
  if (items.length === 0) return;

  await assertAuthSession(supabase);

  return withSyncRetry('push', async () => {
    const { error } = await supabase
      .from('user_products')
      .upsert(items.map((item) => toRow(item, userId)), { onConflict: 'id' });

    if (error) throw error;
  });
}
