-- Tablas operativas: cadetes, comercios, envíos y movimientos (cuenta corriente).
-- Las FK compuestas (mensajeria_id, x_id) garantizan que nada cruce de tenant.

-- "Hoy" siempre en hora de Argentina (el servidor está en UTC: desde las 21 h
-- un envío caería en el día siguiente).
create function public.fecha_operativa() returns date
language sql stable set search_path = '' as $$
  select (now() at time zone 'America/Argentina/Buenos_Aires')::date
$$;

-- Primer día de la semana operativa que contiene p_fecha. p_dia: ISO 1 = lunes … 7 = domingo.
create function private.inicio_semana(p_fecha date, p_dia smallint) returns date
language sql immutable set search_path = '' as $$
  select p_fecha - ((extract(isodow from p_fecha)::int - p_dia + 7) % 7)
$$;

-- ── cadetes ───────────────────────────────────────────────────────────────

create table public.cadetes (
  id             uuid primary key default gen_random_uuid(),
  mensajeria_id  uuid not null references public.mensajerias(id) on delete restrict,
  perfil_id      uuid unique references public.perfiles(user_id) on delete set null,
  nombre         text not null check (length(trim(nombre)) between 1 and 80),
  telefono       text check (telefono is null or length(telefono) <= 30),
  dni            text check (dni is null or dni ~ '^[0-9]{6,9}$'),
  activo         boolean not null default true,
  -- Lo que el cadete debe rendir. Solo lo mantienen los triggers de movimientos.
  saldo          numeric(12,2) not null default 0,
  created_at     timestamptz not null default now(),
  unique (mensajeria_id, id)
);

create unique index cadetes_dni_unico on public.cadetes (mensajeria_id, dni) where dni is not null;

-- ── comercios ─────────────────────────────────────────────────────────────

create table public.comercios (
  id              uuid primary key default gen_random_uuid(),
  mensajeria_id   uuid not null references public.mensajerias(id) on delete restrict,
  perfil_id       uuid unique references public.perfiles(user_id) on delete set null,
  nombre          text not null check (length(trim(nombre)) between 1 and 80),
  direccion       text check (direccion is null or length(direccion) <= 160),
  telefono        text check (telefono is null or length(telefono) <= 30),
  tarifa          numeric(12,2) not null default 0 check (tarifa >= 0),
  cadete_fijo_id  uuid,
  activo          boolean not null default true,
  created_at      timestamptz not null default now(),
  unique (mensajeria_id, id),
  foreign key (mensajeria_id, cadete_fijo_id) references public.cadetes (mensajeria_id, id) on delete set null (cadete_fijo_id)
);

-- ── envios ────────────────────────────────────────────────────────────────

create table public.envios (
  id                 uuid primary key default gen_random_uuid(),
  mensajeria_id      uuid not null references public.mensajerias(id) on delete restrict,
  comercio_id        uuid,
  cadete_id          uuid,
  origen             text not null check (origen in ('comercio', 'cadete', 'admin', 'particular')),
  estado             text not null default 'solicitado'
                     check (estado in ('solicitado', 'asignado', 'retirado', 'entregado', 'cancelado')),
  tarifa             numeric(12,2) not null default 0 check (tarifa >= 0),
  comision           numeric(12,2) not null default 0 check (comision >= 0),
  -- Solo para pedidos sin comercio (particulares): de dónde se retira.
  direccion_origen   text check (direccion_origen is null or length(direccion_origen) <= 160),
  direccion_destino  text not null check (length(trim(direccion_destino)) between 3 and 160),
  nota               text check (nota is null or length(nota) <= 300),
  nombre_contacto    text check (nombre_contacto is null or length(nombre_contacto) <= 80),
  telefono_contacto  text check (telefono_contacto is null or length(telefono_contacto) <= 30),
  confirmado         boolean not null default true,
  fecha_operativa    date not null default public.fecha_operativa(),
  lat_retiro         double precision check (lat_retiro between -90 and 90),
  lng_retiro         double precision check (lng_retiro between -180 and 180),
  lat_entrega        double precision check (lat_entrega between -90 and 90),
  lng_entrega        double precision check (lng_entrega between -180 and 180),
  created_at         timestamptz not null default now(),
  asignado_at        timestamptz,
  retirado_at        timestamptz,
  entregado_at       timestamptz,
  foreign key (mensajeria_id, comercio_id) references public.comercios (mensajeria_id, id) on delete restrict,
  foreign key (mensajeria_id, cadete_id)   references public.cadetes (mensajeria_id, id) on delete restrict,
  constraint envios_cadete_si_en_curso
    check (estado in ('solicitado', 'cancelado') or cadete_id is not null)
);

create index envios_mensajeria_fecha_idx on public.envios (mensajeria_id, fecha_operativa);
create index envios_cadete_estado_idx    on public.envios (cadete_id, estado);
create index envios_comercio_fecha_idx   on public.envios (comercio_id, fecha_operativa);
-- Límite de pedidos públicos por teléfono.
create index envios_particular_tel_idx   on public.envios (telefono_contacto, created_at)
  where origen = 'particular';

-- ── movimientos (libro de la cuenta corriente: solo se insertan) ──────────

create table public.movimientos (
  id             uuid primary key default gen_random_uuid(),
  mensajeria_id  uuid not null references public.mensajerias(id) on delete restrict,
  cadete_id      uuid not null,
  envio_id       uuid unique references public.envios(id) on delete restrict,
  tipo           text not null check (tipo in ('deuda', 'rendicion')),
  monto          numeric(12,2) not null check (monto > 0),
  nota           text check (nota is null or length(nota) <= 200),
  created_by     uuid references auth.users(id) on delete set null default auth.uid(),
  created_at     timestamptz not null default now(),
  foreign key (mensajeria_id, cadete_id) references public.cadetes (mensajeria_id, id) on delete restrict,
  constraint movimientos_deuda_con_envio check ((tipo = 'deuda') = (envio_id is not null))
);

create index movimientos_cadete_fecha_idx on public.movimientos (cadete_id, created_at);
