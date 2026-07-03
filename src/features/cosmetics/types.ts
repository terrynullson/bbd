export type CosmeticStatus = 'fresh' | 'expiring' | 'expired';

export type ProductCategory =
  | 'cream'
  | 'serum'
  | 'toner'
  | 'cleanser'
  | 'mask'
  | 'other';

export interface CosmeticItem {
  id: string;
  name: string;
  brand: string;
  barcode?: string;
  paoMonths: number;
  openedAt: string;
  status: CosmeticStatus;
  category?: ProductCategory;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  notes?: string;
  lookupSource?:
    | 'manual'
    | 'ai'
    | 'ai-barcode'
    | 'barcode'
    | 'open-beauty-facts'
    | 'catalog';
}

export interface AddProductInput {
  name: string;
  brand: string;
  barcode?: string;
  paoMonths: number;
  openedAt: string;
  category?: ProductCategory;
  imageUrl?: string;
  notes?: string;
  lookupSource?: CosmeticItem['lookupSource'];
}

export type UpdateProductInput = AddProductInput;

export interface CosmeticsStorageEnvelope {
  schemaVersion: number;
  items: CosmeticItem[];
}

export interface AnalyzeProductRequest {
  brand?: string;
  name?: string;
  barcode?: string;
}

export interface AnalyzeProductResponse {
  brand: string;
  name: string;
  paoMonths: number;
  category?: ProductCategory;
}

export interface LookupProductResponse {
  found: boolean;
  brand?: string;
  name?: string;
  barcode?: string;
  paoMonths?: number;
  category?: ProductCategory;
  imageUrl?: string;
  source?: 'open-beauty-facts' | 'catalog';
}

export interface ProductSuggestion {
  id: string;
  brand?: string;
  name: string;
  barcode?: string;
  paoMonths?: number;
  category?: ProductCategory;
  imageUrl?: string;
  source: 'local' | 'catalog' | 'personal';
}

export interface StatusSummary {
  fresh: number;
  expiring: number;
  expired: number;
}
