import { readSupabasePublicEnv } from '@/lib/supabase/config';

export async function GET() {
  const { url, anonKey, configured } = readSupabasePublicEnv();

  // Публичный VAPID-ключ безопасно отдавать клиенту — им нельзя подписать push.
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '';

  return Response.json({
    supabaseConfigured: configured,
    url: configured ? url : null,
    anonKey: configured ? anonKey : null,
    vapidPublicKey: vapidPublicKey || null,
  });
}
