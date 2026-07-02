'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    void getSupabaseBrowserClient().then((supabase) => {
      if (!supabase) {
        router.replace('/');
        return;
      }

      void supabase.auth.getSession().finally(() => {
        router.replace('/');
      });
    });
  }, [router]);

  return (
    <div className="flex min-h-dvh items-center justify-center bg-bg px-6 text-center text-muted">
      Завершаем вход...
    </div>
  );
}
