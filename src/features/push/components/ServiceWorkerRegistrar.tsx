'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '../lib/push-client';

/**
 * Регистрирует push-SW при загрузке, чтобы уведомления доходили и при закрытом
 * приложении, а свежий `sw.js` подхватывался на каждом визите. Разрешение
 * НЕ запрашивается — SW сам по себе безобиден и не перехватывает запросы.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    void registerServiceWorker();
  }, []);

  return null;
}
