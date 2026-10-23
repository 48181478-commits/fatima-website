-- 0002_categorias.sql
-- Categorías editables. Ya aplicada al proyecto (2026-10).
-- Idempotente.

create table if not exists public.categorias (
  id uuid primary key default gen_random_uuid(),
  nombre text not null unique,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

alter table public.categorias enable row level security;

drop policy if exists "categorias_lectura_publica" on public.categorias;
create policy "categorias_lectura_publica"
  on public.categorias for select
  using (true);

drop policy if exists "categorias_escritura_autenticada" on public.categorias;
create policy "categorias_escritura_autenticada"
  on public.categorias for all
  to authenticated
  using (true) with check (true);

insert into public.categorias (nombre, orden) values
  ('Historia', 1),
  ('Vida escolar', 2),
  ('Talleres y orientaciones', 3),
  ('Feria de Ciencias', 4),
  ('Deportes', 5),
  ('Actos y eventos', 6),
  ('Egresados', 7),
  ('Instalaciones', 8)
on conflict (nombre) do nothing;
