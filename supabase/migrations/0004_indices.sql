-- 0004_indices.sql
-- Índices y aceleradores de búsqueda. Idempotente.

create extension if not exists pg_trgm;

-- Orden de la galería y proyectos
create index if not exists galeria_fotos_orden_idx
  on public.galeria_fotos (orden);
create index if not exists galeria_fotos_destacada_idx
  on public.galeria_fotos (destacada) where destacada;
create index if not exists galeria_fotos_historica_idx
  on public.galeria_fotos (es_historica) where es_historica;
create index if not exists galeria_fotos_categoria_idx
  on public.galeria_fotos (categoria);

create index if not exists proyectos_orden_idx
  on public.proyectos (orden);
create index if not exists proyectos_estado_idx
  on public.proyectos (estado);

create index if not exists categorias_orden_idx
  on public.categorias (orden);

-- Búsqueda por texto en el panel
create index if not exists galeria_fotos_titulo_trgm_idx
  on public.galeria_fotos using gin (titulo gin_trgm_ops);
create index if not exists galeria_fotos_descripcion_trgm_idx
  on public.galeria_fotos using gin (descripcion gin_trgm_ops);
create index if not exists proyectos_nombre_trgm_idx
  on public.proyectos using gin (nombre gin_trgm_ops);
