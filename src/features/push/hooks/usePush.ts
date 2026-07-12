'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/supabase/use-auth';
import {
  getExistingSubscription,
  getNotificationPermission,
  isPushSupported,
  isStandaloneDisplay,
  registerServiceWorker,
  serializeSubscription,
  subscribeToPush,
  unsubscribeFromPush,
} from '../lib/push-client';
import { deleteSubscription, saveSubscription } from '../lib/subscription-store';

type VapidState = { key: string | null; loaded: boolean };

async function fetchVapidKey(): Promise<string | null> {
  try {
    const res = await fetch('/api/config');
    const data = (await res.json()) as { vapidPublicKey?: string | null };
    return data.vapidPublicKey ?? null;
  } catch {
    return null;
  }
}

function messageFor(reason: string): string {
  switch (reason) {
    case 'permission-denied':
      return 'Разрешение отклонено — включите уведомления в настройках браузера';
    case 'vapid-missing':
      return 'Push не настроен на сервере';
    case 'push-unsupported':
      return 'Браузер не поддерживает уведомления';
    default:
      return 'Не удалось изменить настройку напоминаний';
  }
}

/**
 * Состояние тумблера «Напоминания» в Профиле. Разрешение запрашивается только
 * в [enable], то есть по клику пользователя — никогда при загрузке.
 */
export function usePush() {
  const { supabase, user, status } = useAuth();
  const isSignedIn = status === 'signed-in' && Boolean(user);

  const [supported, setSupported] = useState(false);
  const [standalone, setStandalone] = useState(true);
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [vapid, setVapid] = useState<VapidState>({ key: null, loaded: false });

  const mountedRef = useRef(true);
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Определяем поддержку и текущее состояние подписки при монтировании — чтение
  // браузерных API нельзя вынести в инициализатор useState без рассинхрона с SSR
  // (первый клиентский рендер обязан совпасть с сервером). Разрешение НЕ
  // запрашивается — только читается уже выданное.
  useEffect(() => {
    const ok = isPushSupported();
    // eslint-disable-next-line react-hooks/set-state-in-effect -- чтение браузерных возможностей при монтировании
    setSupported(ok);
    setStandalone(isStandaloneDisplay());
    if (!ok) return;

    setPermission(getNotificationPermission());
    void registerServiceWorker();
    void fetchVapidKey().then((key) => {
      if (mountedRef.current) setVapid({ key, loaded: true });
    });

    void getExistingSubscription().then((sub) => {
      if (mountedRef.current) setEnabled(Boolean(sub));
    });
  }, []);

  const enable = useCallback(async () => {
    setError('');
    if (!supported) {
      setError(messageFor('push-unsupported'));
      return;
    }
    if (!isSignedIn || !supabase || !user) {
      setError('Войдите, чтобы получать напоминания');
      return;
    }
    if (!vapid.key) {
      setError(messageFor('vapid-missing'));
      return;
    }

    setBusy(true);
    try {
      const subscription = await subscribeToPush(vapid.key);
      await saveSubscription(supabase, user.id, serializeSubscription(subscription));
      if (!mountedRef.current) return;
      setEnabled(true);
      setPermission(getNotificationPermission());
    } catch (err) {
      if (!mountedRef.current) return;
      const reason = err instanceof Error ? err.message : '';
      setError(messageFor(reason));
      setPermission(getNotificationPermission());
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [isSignedIn, supabase, supported, user, vapid.key]);

  const disable = useCallback(async () => {
    setError('');
    setBusy(true);
    try {
      const endpoint = await unsubscribeFromPush();
      if (endpoint && supabase) {
        await deleteSubscription(supabase, endpoint);
      }
      if (mountedRef.current) setEnabled(false);
    } catch {
      if (mountedRef.current) setError(messageFor(''));
    } finally {
      if (mountedRef.current) setBusy(false);
    }
  }, [supabase]);

  const toggle = useCallback(() => {
    if (busy) return;
    return enabled ? disable() : enable();
  }, [busy, disable, enable, enabled]);

  return {
    supported,
    standalone,
    permission,
    enabled,
    busy,
    error,
    isSignedIn,
    vapidReady: vapid.loaded && Boolean(vapid.key),
    enable,
    disable,
    toggle,
  };
}
