'use client';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from './client';

type AuthStatus = 'disabled' | 'loading' | 'signed-in' | 'signed-out';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);

  useEffect(() => {
    let mounted = true;

    void getSupabaseBrowserClient().then((client) => {
      if (!mounted) return;

      if (!client) {
        setStatus('disabled');
        return;
      }

      setSupabase(client);
    });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user);
      setStatus(data.user ? 'signed-in' : 'signed-out');
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setStatus(session?.user ? 'signed-in' : 'signed-out');
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [supabase]);

  return { supabase, user, status };
}
