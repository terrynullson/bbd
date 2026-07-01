create extension if not exists pgcrypto;

create table if not exists public.user_products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  brand text not null,
  name text not null,
  category text not null default 'other',
  opened_at timestamptz not null,
  pao_months integer not null check (pao_months > 0 and pao_months <= 60),
  barcode text,
  image_url text,
  notes text,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  client_updated_at timestamptz not null default now()
);

create index if not exists user_products_user_active_idx
  on public.user_products(user_id, deleted_at, client_updated_at desc);

create index if not exists user_products_user_barcode_idx
  on public.user_products(user_id, barcode)
  where barcode is not null;

alter table public.user_products enable row level security;

drop policy if exists "Users can read own products" on public.user_products;
create policy "Users can read own products"
  on public.user_products for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own products" on public.user_products;
create policy "Users can insert own products"
  on public.user_products for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own products" on public.user_products;
create policy "Users can update own products"
  on public.user_products for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.product_catalog (
  id uuid primary key default gen_random_uuid(),
  barcode text,
  brand text not null,
  name text not null,
  normalized_brand text not null,
  normalized_name text not null,
  category text not null default 'other',
  default_pao_months integer check (default_pao_months is null or (default_pao_months > 0 and default_pao_months <= 60)),
  image_url text,
  source text not null default 'manual',
  confidence numeric(3, 2) not null default 0.5,
  usage_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);

create unique index if not exists product_catalog_barcode_uidx
  on public.product_catalog(barcode)
  where barcode is not null;

create unique index if not exists product_catalog_name_uidx
  on public.product_catalog(normalized_brand, normalized_name)
  where barcode is null;

create index if not exists product_catalog_suggest_idx
  on public.product_catalog(normalized_brand, normalized_name);

alter table public.product_catalog enable row level security;

drop policy if exists "Catalog is readable" on public.product_catalog;
create policy "Catalog is readable"
  on public.product_catalog for select
  using (true);

create table if not exists public.brand_catalog (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  normalized_name text not null unique,
  source text not null default 'manual',
  usage_count integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists brand_catalog_suggest_idx
  on public.brand_catalog(normalized_name);

alter table public.brand_catalog enable row level security;

drop policy if exists "Brands are readable" on public.brand_catalog;
create policy "Brands are readable"
  on public.brand_catalog for select
  using (true);

create table if not exists public.api_usage_limits (
  key text not null,
  scope text not null,
  window_start timestamptz not null,
  count integer not null default 1,
  updated_at timestamptz not null default now(),
  primary key (key, scope, window_start)
);

alter table public.api_usage_limits enable row level security;
