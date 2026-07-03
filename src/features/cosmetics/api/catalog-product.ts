import type { AddProductInput } from '../types';
import { assessBarcodeTrust } from '../lib/barcode';
import { buildCatalogPayload } from '../lib/catalog-guard';
import { lookupProductByBarcode } from './lookup-product';

export async function upsertCatalogProduct(input: AddProductInput) {
  try {
    let lookup;
    if (input.barcode) {
      lookup = await lookupProductByBarcode(input.barcode);
    }

    const trust =
      input.barcodeTrust ??
      (input.barcode
        ? assessBarcodeTrust({
            barcode: input.barcode,
            source: input.barcodeSource ?? 'manual',
            lookup,
            savedName: input.name,
          })
        : undefined);

    const payload = buildCatalogPayload(
      input,
      trust ?? 'verified',
      lookup?.found ? lookup : undefined,
    );

    await fetch('/api/products/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Catalog enrichment is best-effort; product save must never fail because of it.
  }
}
