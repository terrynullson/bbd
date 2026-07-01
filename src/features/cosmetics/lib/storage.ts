import { STORAGE_KEY, STORAGE_SCHEMA_VERSION } from '@/lib/constants';
import { calculateStatus } from './calculate-status';
import type { CosmeticItem, CosmeticsStorageEnvelope } from '../types';

type StoredCosmeticItem = Partial<CosmeticItem> &
  Pick<CosmeticItem, 'id' | 'name' | 'brand' | 'paoMonths' | 'openedAt'>;

function isStorageEnvelope(value: unknown): value is CosmeticsStorageEnvelope {
  if (!value || typeof value !== 'object') return false;

  return (
    'schemaVersion' in value &&
    'items' in value &&
    Array.isArray((value as CosmeticsStorageEnvelope).items)
  );
}

function isLegacyItemsArray(value: unknown): value is StoredCosmeticItem[] {
  return Array.isArray(value);
}

function normalizeItem(item: StoredCosmeticItem): CosmeticItem {
  const now = new Date().toISOString();
  const createdAt = item.createdAt ?? now;

  return {
    id: item.id,
    name: item.name,
    brand: item.brand,
    barcode: item.barcode,
    paoMonths: item.paoMonths,
    openedAt: item.openedAt,
    status: calculateStatus(item.openedAt, item.paoMonths),
    category: item.category ?? 'other',
    imageUrl: item.imageUrl,
    createdAt,
    updatedAt: item.updatedAt ?? createdAt,
    deletedAt: item.deletedAt,
    notes: item.notes,
    lookupSource: item.lookupSource,
  };
}

export function readCosmetics(): CosmeticItem[] {
  if (typeof window === 'undefined') return [];

  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as unknown;
    const items = isStorageEnvelope(parsed)
      ? parsed.items
      : isLegacyItemsArray(parsed)
        ? parsed
        : [];

    return items.map(normalizeItem);
  } catch {
    throw new Error('Invalid cosmetics storage');
  }
}

export function writeCosmetics(items: CosmeticItem[]): void {
  if (typeof window === 'undefined') return;

  const envelope: CosmeticsStorageEnvelope = {
    schemaVersion: STORAGE_SCHEMA_VERSION,
    items,
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(envelope));
}
