import type { AddProductInput } from '../types';

export async function upsertCatalogProduct(input: AddProductInput) {
  try {
    await fetch('/api/products/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brand: input.brand,
        name: input.name,
        barcode: input.barcode,
        category: input.category,
        paoMonths: input.paoMonths,
        imageUrl: input.imageUrl,
        source: input.lookupSource ?? (input.barcode ? 'barcode' : 'manual'),
      }),
    });
  } catch {
    // Catalog enrichment is best-effort; product save must never fail because of it.
  }
}
