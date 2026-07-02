'use client';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type PublicSupabaseConfig = {
  url: string;
  anonKey: string;
};

let browserClient: SupabaseClient | null = null;
let configCache: PublicSupabaseConfig | null | undefined;
let configPromise: Promise<PublicSupabaseConfig | null> | null = null;

async function fetchSupabasePublicConfig(): Promise<PublicSupabaseConfig | null> {
  if (configCache !== undefined) {
    return configCache;
  }

  configPromise ??= fetch('/api/config')
    .then((response) => response.json())
    .then(
      (data: {
        supabaseConfigured?: boolean;
        url?: string | null;
        anonKey?: string | null;
      }) => {
        if (!data.supabaseConfigured || !data.url || !data.anonKey) {
          configCache = null;
          return null;
        }

        configCache = { url: data.url, anonKey: data.anonKey };
        return configCache;
      },
    )
    .catch(() => {
      configCache = null;
      return null;
    });

  return configPromise;
}

export async function getSupabaseBrowserClient(): Promise<SupabaseClient | null> {
  const config = await fetchSupabasePublicConfig();
  if (!config) return null;

  browserClient ??= createClient(config.url, config.anonKey, {
    auth: {
      autoRefreshToken: true,
      detectSessionInUrl: true,
      persistSession: true,
    },
  });

  return browserClient;
}
