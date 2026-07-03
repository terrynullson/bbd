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
  expires_at: string | null;
  expiry_source: string | null;
  pao_months: number;
  is_sealed: boolean;
  barcode: string | null;
  barcode_source: string | null;
  barcode_trust: string | null;
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
    expires_at: item.expiresAt?.slice(0, 10) ?? null,
    expiry_source: item.expirySource ?? null,
    pao_months: item.paoMonths,
    is_sealed: item.isSealed ?? false,
    barcode: item.barcode ?? null,
    barcode_source: item.barcodeSource ?? null,
    barcode_trust: item.barcodeTrust ?? null,
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
    expiresAt: row.expires_at ?? undefined,
    expirySource: (row.expiry_source as CosmeticItem['expirySource']) ?? undefined,
    paoMonths: row.pao_months,
    isSealed: row.is_sealed ?? false,
    barcode: row.barcode ?? undefined,
    barcodeSource: (row.barcode_source as CosmeticItem['barcodeSource']) ?? undefined,
    barcodeTrust: (row.barcode_trust as CosmeticItem['barcodeTrust']) ?? undefined,
    imageUrl: row.image_url ?? undefined,
    notes: row.notes ?? undefined,
    lookupSource: row.source ?? 'manual',
    createdAt: row.created_at,
    updatedAt: row.client_updated_at ?? row.updated_at,
    deletedAt: row.deleted_at ?? undefined,
    status: calculateStatus({
      openedAt: row.opened_at,
      paoMonths: row.pao_months,
      isSealed: row.is_sealed ?? false,
      expiresAt: row.expires_at ?? undefined,
    }),
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
