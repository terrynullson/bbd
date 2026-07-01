import { APP_VERSION } from '@/lib/constants';

export async function GET() {
  return Response.json({
    version: APP_VERSION,
    commit: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'local',
  });
}
