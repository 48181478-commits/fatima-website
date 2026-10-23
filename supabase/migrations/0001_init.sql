-- 0001_init.sql
-- Esquema base del sitio (reconstruido a partir del código en uso).
-- Idempotente: usa IF NOT EXISTS / DROP POLICY IF EXISTS, por lo que puede
-- ejecutarse sobre el proyecto existente sin borrar datos.
--
-- Revisar antes de aplicar en producción.

-- ─────────────────────────────────────────────────────────────
-- galeria_fotos
-- ─────────────────────────────────────────────────────────────
create table if not exists public.galeria_fotos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text,
  anio integer,
  lugar text,
  descripcion text,
  imagen_url text not null,
  destacada boolean not null default false,
  es_historica boolean not null default false,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

alter table public.galeria_fotos enable row level security;

drop policy if exists "galeria_lectura_publica" on public.galeria_fotos;
create policy "galeria_lectura_publica"
  on public.galeria_fotos for select
  using (true);

drop policy if exists "galeria_escritura_autenticada" on public.galeria_fotos;
create policy "galeria_escritura_autenticada"
  on public.galeria_fotos for all
  to authenticated
  using (true) with check (true);

-- ─────────────────────────────────────────────────────────────
-- proyectos
-- ─────────────────────────────────────────────────────────────
create table if not exists public.proyectos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  estado text not null default 'activo'
    check (estado in ('activo', 'en_curso', 'finalizado', 'pausado')),
  imagen_url text,
  orden integer not null default 0,
  creado_en timestamptz not null default now()
);

alter table public.proyectos enable row level security;

drop policy if exists "proyectos_lectura_publica" on public.proyectos;
create policy "proyectos_lectura_publica"
  on public.proyectos for select
  using (true);

drop policy if exists "proyectos_escritura_autenticada" on public.proyectos;
create policy "proyectos_escritura_autenticada"
  on public.proyectos for all
  to authenticated
  using (true) with check (true);
