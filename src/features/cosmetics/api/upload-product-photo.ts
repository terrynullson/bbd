import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { compressImageFile } from '../lib/compress-image';
import { PRODUCT_PHOTOS_BUCKET } from '../lib/product-photo-storage';

export async function uploadProductPhoto(
  file: File,
  userId: string,
): Promise<string> {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error('Войдите, чтобы загрузить фото в облако');
  }

  const { blob, mime, extension } = await compressImageFile(file);
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabase.storage.from(PRODUCT_PHOTOS_BUCKET).upload(path, blob, {
    contentType: mime,
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    if (error.message.includes('maximum allowed size')) {
      throw new Error('Файл превышает лимит хранилища');
    }
    if (error.message.includes('mime type')) {
      throw new Error('Формат фото не поддерживается');
    }
    if (error.message.includes('row-level security')) {
      throw new Error('Нет прав на загрузку фото');
    }
    throw new Error('Не удалось загрузить фото');
  }

  const { data } = supabase.storage.from(PRODUCT_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
