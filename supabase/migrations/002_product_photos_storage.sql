insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-photos',
  'product-photos',
  true,
  153600,
  array['image/jpeg', 'image/webp', 'image/png']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Product photos are public" on storage.objects;
create policy "Product photos are public"
  on storage.objects for select
  using (bucket_id = 'product-photos');

drop policy if exists "Users upload own product photos" on storage.objects;
create policy "Users upload own product photos"
  on storage.objects for insert
  with check (
    bucket_id = 'product-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users update own product photos" on storage.objects;
create policy "Users update own product photos"
  on storage.objects for update
  using (
    bucket_id = 'product-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists "Users delete own product photos" on storage.objects;
create policy "Users delete own product photos"
  on storage.objects for delete
  using (
    bucket_id = 'product-photos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
