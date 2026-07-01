'use client';

import { LogIn, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/supabase/use-auth';

export function AuthButton() {
  const { supabase, user, status } = useAuth();

  if (status === 'disabled') {
    return (
      <p className="rounded-[14px] bg-bg px-4 py-3 text-xs leading-relaxed text-muted">
        Облачная синхронизация появится после настройки Supabase env.
      </p>
    );
  }

  if (status === 'loading') {
    return <p className="text-xs text-muted">Проверяем вход...</p>;
  }

  if (user) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-[14px] bg-bg px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-text">Синхронизация включена</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="shrink-0"
          onClick={() => void supabase?.auth.signOut()}
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="secondary"
      className="w-full rounded-[14px]"
      onClick={() => {
        void supabase?.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: `${window.location.origin}/auth/callback`,
          },
        });
      }}
    >
      <LogIn className="h-4 w-4" />
      Войти через Google
    </Button>
  );
}
