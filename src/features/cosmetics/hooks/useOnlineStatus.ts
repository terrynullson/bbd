'use client';

import { useEffect, useState } from 'react';

/** Текущее состояние сети. На сервере считаем, что связь есть. */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );

  useEffect(() => {
    const online = () => setIsOnline(true);
    const offline = () => setIsOnline(false);
    window.addEventListener('online', online);
    window.addEventListener('offline', offline);
    return () => {
      window.removeEventListener('online', online);
      window.removeEventListener('offline', offline);
    };
  }, []);

  return isOnline;
}
