import { NextRequest, NextResponse } from 'next/server';
import webpush, { WebPushError } from 'web-push';
import { buildReminders } from '@/features/cosmetics/lib/reminders';
import type { CosmeticItem } from '@/features/cosmetics/types';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { buildPushPayload } from '@/features/push/lib/dispatch';

// web-push — Node-only (crypto), поэтому не edge. force-dynamic: рассылка не кэшируется.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type SubscriptionRow = {
  id: string;
  user_id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

type ProductRow = {
  id: string;
  name: string;
  opened_at: string;
  pao_months: number;
  is_sealed: boolean | null;
  expires_at: string | null;
  deleted_at: string | null;
};

/** Минимальная проекция строки в форму, которую понимает buildReminders. */
function toReminderItem(row: ProductRow): CosmeticItem {
  return {
    id: row.id,
    name: row.name,
    openedAt: row.opened_at,
    paoMonths: row.pao_months,
    isSealed: row.is_sealed ?? false,
    expiresAt: row.expires_at ?? undefined,
  } as CosmeticItem;
}

/** Секрет принимаем как `Authorization: Bearer <secret>` или `x-cron-secret`. */
function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = request.headers
    .get('authorization')
    ?.match(/^Bearer\s+(.+)$/i)?.[1];
  const header = request.headers.get('x-cron-secret');
  return bearer === secret || header === secret;
}

function configureWebPush(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';
  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

async function dispatch(onlyUserId?: string) {
  const supabase = getSupabaseServerClient({ serviceRole: true });
  if (!supabase) {
    return NextResponse.json(
      { error: 'Supabase not configured' },
      { status: 500 },
    );
  }

  // 1. Все подписки, сгруппированные по пользователю.
  let subQuery = supabase
    .from('push_subscriptions')
    .select('id, user_id, endpoint, p256dh, auth');
  if (onlyUserId) subQuery = subQuery.eq('user_id', onlyUserId);

  const { data: subsData, error: subsError } = await subQuery;
  if (subsError) {
    return NextResponse.json({ error: subsError.message }, { status: 500 });
  }

  const subsByUser = new Map<string, SubscriptionRow[]>();
  for (const row of (subsData ?? []) as SubscriptionRow[]) {
    const list = subsByUser.get(row.user_id) ?? [];
    list.push(row);
    subsByUser.set(row.user_id, list);
  }

  let notificationsSent = 0;
  let staleRemoved = 0;
  const usersNotified: string[] = [];

  for (const [userId, subscriptions] of subsByUser) {
    // 2. Средства пользователя из облака → те же напоминания, что видит клиент.
    const { data: productsData, error: productsError } = await supabase
      .from('user_products')
      .select('id, name, opened_at, pao_months, is_sealed, expires_at, deleted_at')
      .eq('user_id', userId)
      .is('deleted_at', null);

    if (productsError) continue;

    const items = ((productsData ?? []) as ProductRow[]).map(toReminderItem);
    const reminders = buildReminders(items);
    if (reminders.length === 0) continue;

    // 3. Дедуп на уровне БД: вставляем в журнал с ON CONFLICT DO NOTHING и шлём
    //    только реально вставленные строки — гонки между прогонами безопасны.
    const { data: insertedData, error: logError } = await supabase
      .from('notification_log')
      .upsert(
        reminders.map((reminder) => ({
          user_id: userId,
          reminder_id: reminder.id,
        })),
        { onConflict: 'user_id,reminder_id', ignoreDuplicates: true },
      )
      .select('reminder_id');

    if (logError) continue;

    const freshIds = new Set(
      ((insertedData ?? []) as { reminder_id: string }[]).map((r) => r.reminder_id),
    );
    const dueReminders = reminders.filter((reminder) => freshIds.has(reminder.id));
    if (dueReminders.length === 0) continue;

    let deliveredToUser = false;

    for (const reminder of dueReminders) {
      const payload = JSON.stringify(buildPushPayload(reminder));

      for (const subscription of subscriptions) {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: { p256dh: subscription.p256dh, auth: subscription.auth },
            },
            payload,
          );
          notificationsSent += 1;
          deliveredToUser = true;
        } catch (err) {
          // 404/410 — подписка мертва: чистим, чтобы не слать в пустоту.
          if (err instanceof WebPushError && (err.statusCode === 404 || err.statusCode === 410)) {
            await supabase
              .from('push_subscriptions')
              .delete()
              .eq('endpoint', subscription.endpoint);
            staleRemoved += 1;
          }
        }
      }
    }

    if (deliveredToUser) usersNotified.push(userId);
  }

  return NextResponse.json({
    ok: true,
    users: subsByUser.size,
    usersNotified: usersNotified.length,
    notificationsSent,
    staleRemoved,
  });
}

function guard(request: NextRequest): NextResponse | null {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!configureWebPush()) {
    return NextResponse.json(
      { error: 'VAPID keys not configured' },
      { status: 500 },
    );
  }
  return null;
}

/** Vercel Cron дёргает GET и сам добавляет `Authorization: Bearer $CRON_SECRET`. */
export async function GET(request: NextRequest) {
  return guard(request) ?? dispatch();
}

/** Ручной вызов: тем же секретом, с опциональным `{ userId }` для точечной проверки. */
export async function POST(request: NextRequest) {
  const blocked = guard(request);
  if (blocked) return blocked;

  let onlyUserId: string | undefined;
  try {
    const body = await request.json();
    if (body && typeof body.userId === 'string') onlyUserId = body.userId;
  } catch {
    // тело необязательно
  }

  return dispatch(onlyUserId);
}
