/*
 * Service worker для «Где Мой Крем?» — только push-уведомления.
 *
 * Осознанно БЕЗ обработчика `fetch` и без кэширования оболочки: приложение
 * офлайн-first за счёт localStorage, а не Cache API. Пустой SW не перехватывает
 * запросы и потому не может сломать текущее офлайн-поведение или отдать
 * устаревший кэш. Кэш app-shell — отдельная задача с продуманной инвалидацией.
 */

// Новый SW берёт управление сразу, без ожидания закрытия старых вкладок.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

/** Безопасный разбор payload: сервер шлёт JSON, но подстрахуемся от мусора. */
function parsePush(event) {
  if (!event.data) return {};
  try {
    return event.data.json();
  } catch {
    return { body: event.data.text() };
  }
}

self.addEventListener('push', (event) => {
  const payload = parsePush(event);

  const title = payload.title || 'Где Мой Крем?';
  const options = {
    body: payload.body || '',
    icon: '/icons/icon.svg',
    badge: '/icons/icon.svg',
    // tag = reminder_id: одно средство не плодит стопку уведомлений, а обновляет.
    tag: payload.tag || undefined,
    data: { url: payload.url || '/', itemId: payload.itemId || null },
    // Требует явного действия на десктопе; на мобильных ведёт себя как обычное.
    requireInteraction: false,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const data = event.notification.data || {};
  const targetUrl = data.url || '/';

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });

      // Уже открытая вкладка приложения — фокусируем её и подсказываем средство.
      for (const client of allClients) {
        if ('focus' in client) {
          await client.focus();
          if (data.itemId) {
            client.postMessage({ type: 'open-reminder', itemId: data.itemId });
          }
          return;
        }
      }

      // Иначе открываем новое окно на нужном URL.
      if (self.clients.openWindow) {
        await self.clients.openWindow(targetUrl);
      }
    })(),
  );
});
