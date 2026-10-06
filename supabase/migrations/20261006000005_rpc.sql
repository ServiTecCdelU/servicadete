-- RPCs: totales calculados en SQL (nunca se traen filas para sumar en JS) y
-- operaciones atómicas o públicas.

-- ── Cadete: tomar un envío (atómico) ──────────────────────────────────────

create function public.tomar_envio(p_envio uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_cadete uuid := private.mi_cadete_id();
  v_filas int;
begin
  if v_cadete is null then
    raise exception 'Tu usuario de cadete no está activo' using errcode = '42501';
  end if;

  -- Habilita en el trigger la transición solicitado → asignado para este envío.
  perform set_config('servicadete.tomar_envio', p_envio::text, true);

  update public.envios
  set cadete_id = v_cadete, estado = 'asignado'
  where id = p_envio
    and estado = 'solicitado'
    and confirmado
    and mensajeria_id = private.mi_mensajeria();
  get diagnostics v_filas = row_count;

  perform set_config('servicadete.tomar_envio', '', true);

  if v_filas = 0 then
    raise exception 'Otro cadete ya tomó este envío' using errcode = 'P0001';
  end if;
end $$;

-- ── Admin: KPIs del día ───────────────────────────────────────────────────

create function public.kpis_hoy()
returns table (envios bigint, entregados bigint, a_rendir numeric)
language sql stable security definer set search_path = '' as $$
  select
    count(*) filter (where e.estado <> 'cancelado'),
    count(*) filter (where e.estado = 'entregado'),
    coalesce(sum(e.tarifa - e.comision) filter (where e.estado = 'entregado' and e.confirmado), 0)
  from public.envios e
  where private.mi_rol() = 'admin'
    and e.mensajeria_id = private.mi_mensajeria()
    and e.fecha_operativa = public.fecha_operativa()
$$;

-- ── Cadete: cabecera "Debés rendir" / "Ganaste esta semana" ───────────────

create function public.resumen_cadete()
returns table (debe_rendir numeric, ganado_semana numeric, inicio_semana date)
language sql stable security definer set search_path = '' as $$
  with yo as (
    select c.id, c.saldo,
           private.inicio_semana(public.fecha_operativa(), m.dia_inicio_semana) as desde
    from public.cadetes c
    join public.mensajerias m on m.id = c.mensajeria_id
    where c.id = private.mi_cadete_id()
  )
  select
    yo.saldo,
    coalesce((
      select sum(e.comision) from public.envios e
      where e.cadete_id = yo.id and e.estado = 'entregado' and e.confirmado
        and e.fecha_operativa >= yo.desde
    ), 0),
    yo.desde
  from yo
$$;

-- ── Admin: liquidación semanal por cadete ─────────────────────────────────

create function public.liquidacion_semana(p_fecha date default null)
returns table (
  cadete_id uuid, nombre text, activo boolean,
  envios bigint, a_rendir numeric, rendido numeric, saldo numeric,
  desde date, hasta date
)
language sql stable security definer set search_path = '' as $$
  with semana as (
    select m.id as mensajeria_id,
           private.inicio_semana(coalesce(p_fecha, public.fecha_operativa()), m.dia_inicio_semana) as desde
    from public.mensajerias m
    where m.id = private.mi_mensajeria() and private.mi_rol() = 'admin'
  ),
  entregas as (
    select e.cadete_id, count(*) as envios, sum(e.tarifa - e.comision) as a_rendir
    from public.envios e, semana s
    where e.mensajeria_id = s.mensajeria_id
      and e.fecha_operativa >= s.desde and e.fecha_operativa < s.desde + 7
      and e.estado = 'entregado' and e.confirmado
    group by e.cadete_id
  ),
  rendiciones as (
    select mv.cadete_id, sum(mv.monto) as rendido
    from public.movimientos mv, semana s
    where mv.mensajeria_id = s.mensajeria_id and mv.tipo = 'rendicion'
      and (mv.created_at at time zone 'America/Argentina/Buenos_Aires')::date >= s.desde
      and (mv.created_at at time zone 'America/Argentina/Buenos_Aires')::date < s.desde + 7
    group by mv.cadete_id
  )
  select c.id, c.nombre, c.activo,
         coalesce(en.envios, 0), coalesce(en.a_rendir, 0), coalesce(r.rendido, 0), c.saldo,
         s.desde, s.desde + 6
  from semana s
  join public.cadetes c on c.mensajeria_id = s.mensajeria_id
  left join entregas en on en.cadete_id = c.id
  left join rendiciones r on r.cadete_id = c.id
  where c.activo or en.envios is not null or r.rendido is not null or c.saldo <> 0
  order by c.nombre
$$;

-- ── Público: datos de la mensajería para /[slug] ──────────────────────────

create function public.mensajeria_publica(p_slug text)
returns table (nombre text, logo_url text)
language sql stable security definer set search_path = '' as $$
  select m.nombre, m.logo_url from public.mensajerias m
  where m.slug = lower(p_slug) and m.activa
$$;

-- ── Público: pedido de un particular ──────────────────────────────────────

create function public.crear_envio_publico(
  p_slug text, p_nombre text, p_telefono text, p_origen text, p_destino text,
  p_nota text default null, p_web text default null
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  c_max_por_hora constant int := 3;
  v_mensajeria uuid;
  v_telefono text := regexp_replace(coalesce(p_telefono, ''), '\D', '', 'g');
  v_id uuid;
begin
  -- Honeypot: un humano nunca completa el campo oculto "web".
  if coalesce(p_web, '') <> '' then
    raise exception 'Solicitud inválida' using errcode = '22023';
  end if;

  select m.id into v_mensajeria from public.mensajerias m
  where m.slug = lower(p_slug) and m.activa;
  if v_mensajeria is null then
    raise exception 'Mensajería no disponible' using errcode = 'P0002';
  end if;

  if length(trim(coalesce(p_nombre, ''))) not between 2 and 80
     or length(v_telefono) not between 8 and 15
     or length(trim(coalesce(p_origen, ''))) not between 3 and 160
     or length(trim(coalesce(p_destino, ''))) not between 3 and 160
     or length(coalesce(p_nota, '')) > 300 then
    raise exception 'Revisá los datos del pedido' using errcode = '22023';
  end if;

  if (select count(*) from public.envios e
      where e.origen = 'particular' and e.telefono_contacto = v_telefono
        and e.created_at > now() - interval '1 hour') >= c_max_por_hora then
    raise exception 'Hiciste varios pedidos seguidos. Esperá un rato y probá de nuevo.' using errcode = 'P0001';
  end if;

  insert into public.envios (mensajeria_id, origen, estado, confirmado, tarifa,
                             nombre_contacto, telefono_contacto, direccion_origen, direccion_destino, nota)
  values (v_mensajeria, 'particular', 'solicitado', true, 0,
          trim(p_nombre), v_telefono, trim(p_origen), trim(p_destino), nullif(trim(p_nota), ''))
  returning id into v_id;

  return v_id;
end $$;

-- ── Público: seguimiento de un envío (por su UUID, no adivinable) ─────────

create function public.seguimiento_envio(p_id uuid)
returns table (
  estado text, direccion_destino text, created_at timestamptz,
  asignado_at timestamptz, retirado_at timestamptz, entregado_at timestamptz,
  mensajeria_nombre text, mensajeria_logo text, mensajeria_slug text
)
language sql stable security definer set search_path = '' as $$
  select e.estado, e.direccion_destino, e.created_at, e.asignado_at, e.retirado_at, e.entregado_at,
         m.nombre, m.logo_url, m.slug
  from public.envios e
  join public.mensajerias m on m.id = e.mensajeria_id
  where e.id = p_id and e.origen = 'particular'
$$;

-- ── Superadmin: mensajerías con envíos del mes ────────────────────────────

create function public.mensajerias_con_envios_mes()
returns table (
  id uuid, nombre text, slug text, activa boolean, created_at timestamptz, envios_mes bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.es_superadmin() then
    raise exception 'Solo el superadmin' using errcode = '42501';
  end if;

  return query
  select m.id, m.nombre, m.slug, m.activa, m.created_at,
         (select count(*) from public.envios e
          where e.mensajeria_id = m.id and e.estado <> 'cancelado'
            and e.fecha_operativa >= date_trunc('month', public.fecha_operativa())::date)
  from public.mensajerias m
  order by m.created_at desc;
end $$;

-- ── Permisos ──────────────────────────────────────────────────────────────

revoke all on function
  public.tomar_envio(uuid), public.kpis_hoy(), public.resumen_cadete(),
  public.liquidacion_semana(date), public.mensajeria_publica(text),
  public.crear_envio_publico(text, text, text, text, text, text, text),
  public.seguimiento_envio(uuid), public.mensajerias_con_envios_mes(), public.fecha_operativa()
from public;

grant execute on function
  public.tomar_envio(uuid), public.kpis_hoy(), public.resumen_cadete(),
  public.liquidacion_semana(date), public.mensajerias_con_envios_mes(), public.fecha_operativa()
to authenticated;

grant execute on function
  public.mensajeria_publica(text),
  public.crear_envio_publico(text, text, text, text, text, text, text),
  public.seguimiento_envio(uuid)
to anon, authenticated;

-- Helpers internos usados desde funciones/triggers.
revoke all on function private.inicio_semana(date, smallint), private.transicion_valida(text, text),
  private.rol_app() from public, anon;
