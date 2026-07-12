-- Web push: подписки браузеров и журнал отправленных напоминаний.
-- Существующие таблицы не трогаем.

-- Подписки PushManager. Endpoint уникален у самого push-сервиса → глобальный unique.
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- Пользователь видит и меняет только свои подписки. Сервисный ключ (dispatch)
-- обходит RLS и читает все.
drop policy if exists "Users can read own push subscriptions" on public.push_subscriptions;
create policy "Users can read own push subscriptions"
  on public.push_subscriptions for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own push subscriptions" on public.push_subscriptions;
create policy "Users can insert own push subscriptions"
  on public.push_subscriptions for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own push subscriptions" on public.push_subscriptions;
create policy "Users can update own push subscriptions"
  on public.push_subscriptions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own push subscriptions" on public.push_subscriptions;
create policy "Users can delete own push subscriptions"
  on public.push_subscriptions for delete
  using (auth.uid() = user_id);

-- Журнал дедупликации. reminder_id стабилен (`itemId:kind`): переход
-- expiring→expired даёт новый id → повторное уведомление корректно.
create table if not exists public.notification_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reminder_id text not null,
  sent_at timestamptz not null default now(),
  unique (user_id, reminder_id)
);

create index if not exists notification_log_user_idx
  on public.notification_log(user_id);

alter table public.notification_log enable row level security;

-- Пишет только dispatch под сервисным ключом (обходит RLS). Клиенту оставляем
-- лишь чтение своего журнала — на будущее, без прав на запись.
drop policy if exists "Users can read own notification log" on public.notification_log;
create policy "Users can read own notification log"
  on public.notification_log for select
  using (auth.uid() = user_id);
