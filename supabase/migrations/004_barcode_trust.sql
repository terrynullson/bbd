alter table user_products
  add column if not exists barcode_source text,
  add column if not exists barcode_trust text;

alter table product_catalog
  add column if not exists barcode_trust text,
  add column if not exists barcode_source text;
