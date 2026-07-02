import type { SupabaseClient, Session } from '@supabase/supabase-js';

const RETRY_DELAYS_MS = [300, 600, 1200];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function logSyncError(phase: string, error: unknown) {
  console.warn(`[sync] ${phase}`, error);
}

export async function waitForAuthSession(
  supabase: SupabaseClient,
  maxAttempts = 6,
): Promise<Session | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) return session;
    await delay(200 * (attempt + 1));
  }
  return null;
}

export async function withSyncRetry<T>(
  phase: string,
  fn: () => Promise<T>,
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      logSyncError(`${phase} (attempt ${attempt + 1})`, error);
      if (attempt < RETRY_DELAYS_MS.length) {
        await delay(RETRY_DELAYS_MS[attempt]);
      }
    }
  }
  throw lastError;
}
