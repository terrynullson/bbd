import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { compressImageFile } from '../lib/compress-image';

const BUCKET = 'product-photos';

export async function uploadProductPhoto(
  file: File,
  userId: string,
): Promise<string> {
  const supabase = await getSupabaseBrowserClient();
  if (!supabase) {
    throw new Error('Войдите, чтобы загрузить фото в облако');
  }

  const compressed = await compressImageFile(file);
  const path = `${userId}/${crypto.randomUUID()}.jpg`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed, {
    contentType: 'image/jpeg',
    cacheControl: '31536000',
    upsert: false,
  });

  if (error) {
    throw new Error('Не удалось загрузить фото');
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
