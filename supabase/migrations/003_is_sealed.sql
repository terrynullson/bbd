alter table public.user_products
  add column if not exists is_sealed boolean not null default false;
