'use client';

import type { Provider } from '@supabase/supabase-js';
import { LogIn, LogOut, Mail } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Spinner } from '@/components/ui/Spinner';
import { haptic } from '@/lib/haptics';
import { useAuth } from '@/lib/supabase/use-auth';

function getRedirectUrl() {
  if (typeof window === 'undefined') return undefined;
  return `${window.location.origin}/auth/callback`;
}

type OAuthProvider = 'google' | 'yandex';

const OAUTH_PROVIDERS: Record<OAuthProvider, Provider> = {
  google: 'google',
  yandex: 'yandex' as Provider,
};

export function AuthPanel() {
  const { supabase, user, status } = useAuth();
  const [email, setEmail] = useState('');
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState<OAuthProvider | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [error, setError] = useState('');

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
          onClick={() => {
            haptic('light');
            void supabase?.auth.signOut();
          }}
        >
          <LogOut className="h-4 w-4" />
          Выйти
        </Button>
      </div>
    );
  }

  const handleEmailSignIn = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Введите email');
      haptic('error');
      return;
    }

    setIsEmailLoading(true);
    setError('');
    haptic('medium');

    try {
      const { error: signInError } = await supabase!.auth.signInWithOtp({
        email: trimmedEmail,
        options: { emailRedirectTo: getRedirectUrl() },
      });

      if (signInError) throw signInError;
      setEmailSent(true);
      haptic('success');
    } catch (signInError) {
      setError(
        signInError instanceof Error
          ? signInError.message
          : 'Не удалось отправить ссылку',
      );
      haptic('error');
    } finally {
      setIsEmailLoading(false);
    }
  };

  const handleOAuth = async (provider: OAuthProvider) => {
    setIsOAuthLoading(provider);
    setError('');
    haptic('medium');

    try {
      const { error: oauthError } = await supabase!.auth.signInWithOAuth({
        provider: OAUTH_PROVIDERS[provider],
        options: { redirectTo: getRedirectUrl() },
      });

      if (oauthError) throw oauthError;
    } catch (oauthError) {
      setError(
        oauthError instanceof Error
          ? oauthError.message
          : `Не удалось войти через ${provider === 'google' ? 'Google' : 'Яндекс'}`,
      );
      haptic('error');
      setIsOAuthLoading(null);
    }
  };

  if (emailSent) {
    return (
      <div className="rounded-[14px] border border-accent/25 bg-accent/5 px-4 py-4 text-center">
        <Mail className="mx-auto h-6 w-6 text-accent" />
        <p className="mt-2 text-sm font-medium text-text">Проверьте почту</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          Мы отправили ссылку для входа на{' '}
          <span className="font-medium text-text">{email.trim()}</span>
        </p>
        <button
          type="button"
          onClick={() => {
            setEmailSent(false);
            haptic('light');
          }}
          className="mt-3 text-xs text-muted underline-offset-2 hover:text-text hover:underline"
        >
          Изменить email
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Email
        </p>
        <div className="flex gap-2">
          <Input
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            disabled={isEmailLoading || Boolean(isOAuthLoading)}
            onChange={(e) => {
              setEmail(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleEmailSignIn();
            }}
            className="min-w-0 flex-1"
          />
          <Button
            type="button"
            size="md"
            disabled={isEmailLoading || Boolean(isOAuthLoading)}
            onClick={() => void handleEmailSignIn()}
            className="shrink-0"
          >
            {isEmailLoading ? <Spinner /> : <LogIn className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[11px] uppercase tracking-[0.14em] text-muted">или</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <Button
        type="button"
        variant="secondary"
        className="w-full rounded-[14px]"
        disabled={isEmailLoading || isOAuthLoading !== null}
        onClick={() => void handleOAuth('google')}
      >
        {isOAuthLoading === 'google' ? (
          <Spinner />
        ) : (
          <>
            <span className="text-base leading-none">G</span>
            Войти через Google
          </>
        )}
      </Button>

      <Button
        type="button"
        variant="secondary"
        className="w-full rounded-[14px]"
        disabled={isEmailLoading || isOAuthLoading !== null}
        onClick={() => void handleOAuth('yandex')}
      >
        {isOAuthLoading === 'yandex' ? (
          <Spinner />
        ) : (
          <>
            <span className="text-base font-bold leading-none text-[#fc3f1d]">Я</span>
            Войти через Яндекс
          </>
        )}
      </Button>

      {error && <p className="text-xs text-expired">{error}</p>}

      <p className="text-center text-[11px] leading-relaxed text-muted/80">
        Яндекс ID нужно включить в Supabase Dashboard → Authentication → Providers.
      </p>
    </div>
  );
}
