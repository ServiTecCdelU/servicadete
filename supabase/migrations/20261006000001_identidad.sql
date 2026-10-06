-- Núcleo de identidad multi-tenant: mensajerías, perfiles y helpers de RLS.

create schema if not exists private;

-- ── Tablas ────────────────────────────────────────────────────────────────

create table public.mensajerias (
  id                 uuid primary key default gen_random_uuid(),
  nombre             text not null check (length(trim(nombre)) between 2 and 80),
  slug               text not null unique check (slug ~ '^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$'),
  logo_url           text,
  comision_cadete    numeric(12,2) not null default 1700 check (comision_cadete >= 0),
  -- ISO: 1 = lunes … 7 = domingo
  dia_inicio_semana  smallint not null default 1 check (dia_inicio_semana between 1 and 7),
  activa             boolean not null default true,
  created_at         timestamptz not null default now()
);

create table public.perfiles (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  mensajeria_id  uuid references public.mensajerias(id) on delete restrict,
  rol            text not null check (rol in ('superadmin', 'admin', 'cadete', 'comercio')),
  nombre         text not null check (length(trim(nombre)) between 1 and 80),
  created_at     timestamptz not null default now(),
  -- El superadmin no pertenece a ninguna mensajería; el resto sí.
  constraint perfiles_tenant_por_rol check ((rol = 'superadmin') = (mensajeria_id is null))
);

create index perfiles_mensajeria_idx on public.perfiles (mensajeria_id);

-- ── Helpers (schema private: no expuesto por la API) ─────────────────────

-- Mensajería del usuario actual. Devuelve null si la mensajería está suspendida,
-- así un tenant suspendido queda sin acceso a sus datos sin tocar cada policy.
create function private.mi_mensajeria() returns uuid
language sql stable security definer set search_path = '' as $$
  select p.mensajeria_id
  from public.perfiles p
  join public.mensajerias m on m.id = p.mensajeria_id and m.activa
  where p.user_id = auth.uid()
$$;

create function private.mi_rol() returns text
language sql stable security definer set search_path = '' as $$
  select p.rol from public.perfiles p where p.user_id = auth.uid()
$$;

create function private.es_superadmin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce((select p.rol = 'superadmin' from public.perfiles p where p.user_id = auth.uid()), false)
$$;

revoke all on function private.mi_mensajeria(), private.mi_rol(), private.es_superadmin() from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.mi_mensajeria(), private.mi_rol(), private.es_superadmin() to authenticated;

-- Solo el superadmin puede activar o suspender una mensajería.
create function private.guard_mensajeria_activa() returns trigger
language plpgsql set search_path = '' as $$
begin
  if new.activa is distinct from old.activa and not private.es_superadmin()
     and auth.role() <> 'service_role' then
    raise exception 'Solo el superadmin puede cambiar el estado de una mensajería';
  end if;
  return new;
end $$;

create trigger mensajerias_guard_activa
  before update on public.mensajerias
  for each row execute function private.guard_mensajeria_activa();

-- ── RLS ───────────────────────────────────────────────────────────────────

alter table public.mensajerias enable row level security;
alter table public.perfiles    enable row level security;

revoke all on public.mensajerias, public.perfiles from anon;

create policy mensajerias_select on public.mensajerias for select to authenticated
  using ((select private.es_superadmin()) or id = (select private.mi_mensajeria()));

create policy mensajerias_insert on public.mensajerias for insert to authenticated
  with check ((select private.es_superadmin()));

create policy mensajerias_update on public.mensajerias for update to authenticated
  using (
    (select private.es_superadmin())
    or (id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'admin')
  );

-- Perfiles: cada uno ve el suyo; el admin ve los de su mensajería; el superadmin, todos.
-- Las altas y cambios se hacen desde server actions con la secret key (no hay policies de escritura).
create policy perfiles_select on public.perfiles for select to authenticated
  using (
    user_id = (select auth.uid())
    or (select private.es_superadmin())
    or (mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'admin')
  );
