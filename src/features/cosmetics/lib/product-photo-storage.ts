import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export const PRODUCT_PHOTOS_BUCKET = 'product-photos';

const BUCKET_PATH_MARKER = `/${PRODUCT_PHOTOS_BUCKET}/`;

export function parseProductPhotoStoragePath(publicUrl: string): string | null {
  if (!publicUrl || publicUrl.startsWith('data:')) return null;

  try {
    const url = new URL(publicUrl);
    const index = url.pathname.indexOf(BUCKET_PATH_MARKER);
    if (index === -1) return null;

    const path = decodeURIComponent(
      url.pathname.slice(index + BUCKET_PATH_MARKER.length),
    );
    if (!path || path.includes('..')) return null;

    return path;
  } catch {
    return null;
  }
}

export function isOwnedProductPhotoUrl(publicUrl?: string): boolean {
  return Boolean(publicUrl && parseProductPhotoStoragePath(publicUrl));
}

export async function deleteProductPhoto(publicUrl?: string): Promise<void> {
  if (!publicUrl) return;

  const path = parseProductPhotoStoragePath(publicUrl);
  if (!path) return;

  const supabase = await getSupabaseBrowserClient();
  if (!supabase) return;

  const { error } = await supabase.storage
    .from(PRODUCT_PHOTOS_BUCKET)
    .remove([path]);

  if (error) {
    return;
  }
}
