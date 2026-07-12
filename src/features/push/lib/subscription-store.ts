'use client';

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SerializedSubscription } from './push-client';

/**
 * Подписки пишутся клиентом напрямую в Supabase под RLS — как и user_products.
 * Отдельный API-роут не нужен: пользователь и так владеет своей строкой.
 */

const TABLE = 'push_subscriptions';

export async function saveSubscription(
  supabase: SupabaseClient,
  userId: string,
  subscription: SerializedSubscription,
): Promise<void> {
  // onConflict endpoint: переустановка/повторное включение обновляет ключи,
  // а не плодит дубли (endpoint уникален глобально у самого push-сервиса).
  const { error } = await supabase.from(TABLE).upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
    },
    { onConflict: 'endpoint' },
  );

  if (error) throw error;
}

export async function deleteSubscription(
  supabase: SupabaseClient,
  endpoint: string,
): Promise<void> {
  const { error } = await supabase.from(TABLE).delete().eq('endpoint', endpoint);
  if (error) throw error;
}
