-- 0005_normalizar.sql
-- Normalización incremental y segura del esquema. Idempotente.
--
-- IMPORTANTE: revisar el diagnóstico final. Hoy las 31 fotos tienen
-- categoria = 'eurocolor', que no coincide con ninguna fila de categorias,
-- así que el backfill de categoria_id no las va a completar hasta que se
-- corrijan las categorías de las fotos.

-- 1) categoria_id con FK (se conserva la columna de texto por compatibilidad)
alter table public.galeria_fotos
  add column if not exists categoria_id uuid
  references public.categorias(id) on delete set null;

update public.galeria_fotos f
set categoria_id = c.id
from public.categorias c
where f.categoria_id is null
  and f.categoria is not null
  and lower(trim(f.categoria)) = lower(trim(c.nombre));

create index if not exists galeria_fotos_categoria_id_idx
  on public.galeria_fotos (categoria_id);

-- 2) actualizado_en con trigger
alter table public.galeria_fotos
  add column if not exists actualizado_en timestamptz not null default now();

create or replace function public.marcar_actualizado()
returns trigger
language plpgsql
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

drop trigger if exists galeria_fotos_marcar_actualizado on public.galeria_fotos;
create trigger galeria_fotos_marcar_actualizado
  before update on public.galeria_fotos
  for each row execute function public.marcar_actualizado();

-- 3) CHECK de estado en proyectos (idempotente)
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'proyectos_estado_check'
  ) then
    alter table public.proyectos
      add constraint proyectos_estado_check
      check (estado in ('activo', 'en_curso', 'finalizado', 'pausado'));
  end if;
end;
$$;

-- 4) Diagnóstico posterior
select
  count(*) as total,
  count(categoria_id) as con_categoria_id,
  count(*) filter (where categoria_id is null and categoria is not null) as sin_match
from public.galeria_fotos;
