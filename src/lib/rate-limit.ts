import { createHash } from 'crypto';
import { NextRequest } from 'next/server';
import { getSupabaseServerClient } from './supabase/server';

type RateLimitOptions = {
  request: NextRequest;
  scope: string;
  limit: number;
  windowSeconds: number;
  userId?: string;
};

type UsageRow = {
  count: number;
};

function getClientKey(request: NextRequest, userId?: string) {
  if (userId) return `user:${userId}`;

  const forwardedFor = request.headers.get('x-forwarded-for') ?? '';
  const realIp = request.headers.get('x-real-ip') ?? '';
  const userAgent = request.headers.get('user-agent') ?? '';
  const raw = `${forwardedFor.split(',')[0] || realIp || 'unknown'}:${userAgent}`;

  return `anon:${createHash('sha256').update(raw).digest('hex').slice(0, 32)}`;
}

function getWindowStart(windowSeconds: number) {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  return new Date(Math.floor(now / windowMs) * windowMs).toISOString();
}

export async function checkRateLimit({
  request,
  scope,
  limit,
  windowSeconds,
  userId,
}: RateLimitOptions) {
  const supabase = getSupabaseServerClient({ serviceRole: true });
  if (!supabase) return { allowed: true, remaining: limit };

  const key = getClientKey(request, userId);
  const windowStart = getWindowStart(windowSeconds);

  const { data } = await supabase
    .from('api_usage_limits')
    .select('count')
    .eq('key', key)
    .eq('scope', scope)
    .eq('window_start', windowStart)
    .maybeSingle();

  const current = ((data as UsageRow | null)?.count ?? 0) + 1;

  if (current > limit) {
    return { allowed: false, remaining: 0 };
  }

  await supabase.from('api_usage_limits').upsert(
    {
      key,
      scope,
      window_start: windowStart,
      count: current,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'key,scope,window_start' },
  );

  return { allowed: true, remaining: Math.max(0, limit - current) };
}

export async function getRequestUserId(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  const token = auth.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!token) return undefined;

  const supabase = getSupabaseServerClient();
  if (!supabase) return undefined;

  const { data } = await supabase.auth.getUser(token);
  return data.user?.id;
}
