import { createClient } from '@supabase/supabase-js';
import {
  isSupabaseConfigured,
  SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_URL,
} from './config';

export function getSupabaseServerClient(options?: {
  serviceRole?: boolean;
  authToken?: string;
}) {
  if (!isSupabaseConfigured()) return null;

  const key = options?.serviceRole
    ? SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY
    : SUPABASE_ANON_KEY;

  return createClient(SUPABASE_URL, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: options?.authToken
      ? {
          headers: {
            Authorization: `Bearer ${options.authToken}`,
          },
        }
      : undefined,
  });
}
