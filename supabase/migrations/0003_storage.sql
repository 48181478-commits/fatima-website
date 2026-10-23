-- 0003_storage.sql
-- Bucket de imágenes y políticas de Storage.
-- Requiere permisos sobre el esquema storage (se aplica con db push o desde
-- el dashboard). Idempotente.

insert into storage.buckets (id, name, public)
values ('Fatima-website-imagenes', 'Fatima-website-imagenes', true)
on conflict (id) do nothing;

drop policy if exists "imagenes_lectura_publica" on storage.objects;
create policy "imagenes_lectura_publica"
  on storage.objects for select
  using (bucket_id = 'Fatima-website-imagenes');

drop policy if exists "imagenes_escritura_autenticada" on storage.objects;
create policy "imagenes_escritura_autenticada"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'Fatima-website-imagenes')
  with check (bucket_id = 'Fatima-website-imagenes');
