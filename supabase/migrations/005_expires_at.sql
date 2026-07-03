alter table user_products
  add column if not exists expires_at date,
  add column if not exists expiry_source text;
