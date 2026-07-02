import { readSupabasePublicEnv } from '@/lib/supabase/config';

export async function GET() {
  const { url, anonKey, configured } = readSupabasePublicEnv();

  return Response.json({
    supabaseConfigured: configured,
    url: configured ? url : null,
    anonKey: configured ? anonKey : null,
  });
}
