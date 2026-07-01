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
}

export interface AddProductInput {
  name: string;
  brand: string;
  barcode?: string;
  paoMonths: number;
  openedAt: string;
  category?: ProductCategory;
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

export interface StatusSummary {
  fresh: number;
  expiring: number;
  expired: number;
}
