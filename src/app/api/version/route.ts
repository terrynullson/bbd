import { APP_VERSION } from '@/lib/constants';
import { readSupabasePublicEnv } from '@/lib/supabase/config';

export async function GET() {
  const { configured } = readSupabasePublicEnv();

  return Response.json({
    version: APP_VERSION,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
    supabaseConfigured: configured,
  });
}
