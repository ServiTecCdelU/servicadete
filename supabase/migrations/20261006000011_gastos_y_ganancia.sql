-- Gastos operativos (combustible, reparaciones, etc.) y métricas financieras
-- completas para el admin: ganancia neta por día/semana/mes y ranking de comercios.

create table public.gastos (
  id             uuid primary key default gen_random_uuid(),
  mensajeria_id  uuid not null references public.mensajerias(id) on delete restrict,
  concepto       text not null check (length(trim(concepto)) between 2 and 120),
  monto          numeric(12,2) not null check (monto > 0),
  nota           text check (nota is null or length(nota) <= 200),
  fecha_operativa date not null default public.fecha_operativa(),
  created_by     uuid references auth.users(id) on delete set null default auth.uid(),
  created_at     timestamptz not null default now()
);

create index gastos_mensajeria_fecha_idx on public.gastos (mensajeria_id, fecha_operativa);

alter table public.gastos enable row level security;
revoke all on public.gastos from anon;
revoke insert, update, delete on public.gastos from authenticated;
grant insert (concepto, monto, nota) on public.gastos to authenticated;

create policy gastos_select on public.gastos for select to authenticated using (
  mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'admin'
);
create policy gastos_insert on public.gastos for insert to authenticated with check (
  mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'admin'
);

create function private.gastos_antes_de_insertar() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.mensajeria_id := private.mi_mensajeria();
  new.fecha_operativa := public.fecha_operativa();
  new.created_by := auth.uid();
  new.created_at := now();
  return new;
end $$;

create trigger gastos_antes_de_insertar
  before insert on public.gastos
  for each row execute function private.gastos_antes_de_insertar();

-- ── Métricas por día / semana / mes: facturado, lo que se paga a cadetes
-- (comisiones), gastos y ganancia neta = facturado - comisiones - gastos. ──

drop function if exists public.metricas_diarias(int);
drop function if exists public.metricas_semanales(int);
drop function if exists public.kpis_hoy();

create function public.metricas_diarias(p_dias int default 14)
returns table (
  fecha date, envios bigint, entregados bigint, cancelados bigint,
  facturado numeric, comisiones numeric, gastos numeric, ganancia numeric
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_mensajeria uuid := private.mi_mensajeria();
begin
  if private.mi_rol() <> 'admin' then
    raise exception 'Solo el admin' using errcode = '42501';
  end if;
  if p_dias < 1 or p_dias > 92 then
    raise exception 'Rango inválido (1 a 92 días)' using errcode = '22023';
  end if;

  return query
  with dias as (
    select d.fecha::date as fecha
    from generate_series(public.fecha_operativa() - (p_dias - 1), public.fecha_operativa(), interval '1 day') as d(fecha)
  ),
  env as (
    select e.fecha_operativa as fecha,
           count(*) filter (where e.estado <> 'cancelado') as envios,
           count(*) filter (where e.estado = 'entregado') as entregados,
           count(*) filter (where e.estado = 'cancelado') as cancelados,
           coalesce(sum(e.tarifa) filter (where e.estado = 'entregado' and e.confirmado), 0) as facturado,
           coalesce(sum(e.comision) filter (where e.estado = 'entregado' and e.confirmado), 0) as comisiones
    from public.envios e
    where e.mensajeria_id = v_mensajeria and e.fecha_operativa between public.fecha_operativa() - (p_dias - 1) and public.fecha_operativa()
    group by e.fecha_operativa
  ),
  gas as (
    select g.fecha_operativa as fecha, sum(g.monto) as gastos
    from public.gastos g
    where g.mensajeria_id = v_mensajeria and g.fecha_operativa between public.fecha_operativa() - (p_dias - 1) and public.fecha_operativa()
    group by g.fecha_operativa
  )
  select d.fecha, coalesce(env.envios, 0), coalesce(env.entregados, 0), coalesce(env.cancelados, 0),
         coalesce(env.facturado, 0), coalesce(env.comisiones, 0), coalesce(gas.gastos, 0),
         coalesce(env.facturado, 0) - coalesce(env.comisiones, 0) - coalesce(gas.gastos, 0)
  from dias d
  left join env on env.fecha = d.fecha
  left join gas on gas.fecha = d.fecha
  order by d.fecha desc;
end $$;

create function public.metricas_semanales(p_semanas int default 8)
returns table (
  semana_inicio date, semana_fin date, envios bigint, entregados bigint,
  facturado numeric, comisiones numeric, gastos numeric, ganancia numeric
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_mensajeria uuid := private.mi_mensajeria();
  v_dia smallint;
  v_hoy date := public.fecha_operativa();
begin
  if private.mi_rol() <> 'admin' then
    raise exception 'Solo el admin' using errcode = '42501';
  end if;
  if p_semanas < 1 or p_semanas > 52 then
    raise exception 'Rango inválido (1 a 52 semanas)' using errcode = '22023';
  end if;

  select m.dia_inicio_semana into v_dia from public.mensajerias m where m.id = v_mensajeria;

  return query
  with semanas as (
    select private.inicio_semana(v_hoy, v_dia) - (7 * s) as desde
    from generate_series(0, p_semanas - 1) as s
  ),
  env as (
    select s.desde,
           count(e.id) filter (where e.estado <> 'cancelado') as envios,
           count(e.id) filter (where e.estado = 'entregado') as entregados,
           coalesce(sum(e.tarifa) filter (where e.estado = 'entregado' and e.confirmado), 0) as facturado,
           coalesce(sum(e.comision) filter (where e.estado = 'entregado' and e.confirmado), 0) as comisiones
    from semanas s
    left join public.envios e
      on e.mensajeria_id = v_mensajeria and e.fecha_operativa >= s.desde and e.fecha_operativa < s.desde + 7
    group by s.desde
  ),
  gas as (
    select s.desde, coalesce(sum(g.monto), 0) as gastos
    from semanas s
    left join public.gastos g
      on g.mensajeria_id = v_mensajeria and g.fecha_operativa >= s.desde and g.fecha_operativa < s.desde + 7
    group by s.desde
  )
  select env.desde, env.desde + 6, env.envios, env.entregados, env.facturado, env.comisiones, gas.gastos,
         env.facturado - env.comisiones - gas.gastos
  from env join gas on gas.desde = env.desde
  order by env.desde desc;
end $$;

create function public.metricas_mensuales(p_meses int default 6)
returns table (
  mes date, envios bigint, entregados bigint,
  facturado numeric, comisiones numeric, gastos numeric, ganancia numeric
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_mensajeria uuid := private.mi_mensajeria();
  v_desde date;
begin
  if private.mi_rol() <> 'admin' then
    raise exception 'Solo el admin' using errcode = '42501';
  end if;
  if p_meses < 1 or p_meses > 24 then
    raise exception 'Rango inválido (1 a 24 meses)' using errcode = '22023';
  end if;

  v_desde := date_trunc('month', public.fecha_operativa())::date - ((p_meses - 1) * interval '1 month');

  return query
  with meses as (
    select (date_trunc('month', v_desde) + (m * interval '1 month'))::date as mes
    from generate_series(0, p_meses - 1) as m
  ),
  env as (
    select date_trunc('month', e.fecha_operativa)::date as mes,
           count(*) filter (where e.estado <> 'cancelado') as envios,
           count(*) filter (where e.estado = 'entregado') as entregados,
           coalesce(sum(e.tarifa) filter (where e.estado = 'entregado' and e.confirmado), 0) as facturado,
           coalesce(sum(e.comision) filter (where e.estado = 'entregado' and e.confirmado), 0) as comisiones
    from public.envios e
    where e.mensajeria_id = v_mensajeria and e.fecha_operativa >= v_desde
    group by 1
  ),
  gas as (
    select date_trunc('month', g.fecha_operativa)::date as mes, sum(g.monto) as gastos
    from public.gastos g
    where g.mensajeria_id = v_mensajeria and g.fecha_operativa >= v_desde
    group by 1
  )
  select m.mes, coalesce(env.envios, 0), coalesce(env.entregados, 0), coalesce(env.facturado, 0),
         coalesce(env.comisiones, 0), coalesce(gas.gastos, 0),
         coalesce(env.facturado, 0) - coalesce(env.comisiones, 0) - coalesce(gas.gastos, 0)
  from meses m
  left join env on env.mes = m.mes
  left join gas on gas.mes = m.mes
  order by m.mes desc;
end $$;

-- Qué comercio vende más (rango de días hacia atrás desde hoy, incluido).
create function public.ranking_comercios(p_dias int default 30)
returns table (comercio_id uuid, nombre text, envios bigint, entregados bigint, facturado numeric)
language plpgsql stable security definer set search_path = '' as $$
begin
  if private.mi_rol() <> 'admin' then
    raise exception 'Solo el admin' using errcode = '42501';
  end if;
  if p_dias < 1 or p_dias > 366 then
    raise exception 'Rango inválido (1 a 366 días)' using errcode = '22023';
  end if;

  return query
  select c.id, c.nombre,
         count(e.id) filter (where e.estado <> 'cancelado'),
         count(e.id) filter (where e.estado = 'entregado'),
         coalesce(sum(e.tarifa) filter (where e.estado = 'entregado' and e.confirmado), 0)
  from public.comercios c
  left join public.envios e
    on e.comercio_id = c.id and e.fecha_operativa >= public.fecha_operativa() - (p_dias - 1)
  where c.mensajeria_id = private.mi_mensajeria()
  group by c.id, c.nombre
  having count(e.id) > 0
  order by facturado desc, envios desc;
end $$;

-- Cuánto se le paga a cada cadete y la ganancia neta de hoy (para la cabecera del panel).
create function public.kpis_hoy()
returns table (envios bigint, entregados bigint, a_rendir numeric, pagado_cadetes numeric, gastos numeric, ganancia numeric)
language sql stable security definer set search_path = '' as $$
  select
    count(*) filter (where e.estado <> 'cancelado'),
    count(*) filter (where e.estado = 'entregado'),
    coalesce(sum(e.tarifa - e.comision) filter (where e.estado = 'entregado' and e.confirmado), 0),
    coalesce(sum(e.comision) filter (where e.estado = 'entregado' and e.confirmado), 0),
    coalesce((select sum(g.monto) from public.gastos g
              where g.mensajeria_id = private.mi_mensajeria() and g.fecha_operativa = public.fecha_operativa()), 0),
    coalesce(sum(e.tarifa) filter (where e.estado = 'entregado' and e.confirmado), 0)
      - coalesce(sum(e.comision) filter (where e.estado = 'entregado' and e.confirmado), 0)
      - coalesce((select sum(g.monto) from public.gastos g
                  where g.mensajeria_id = private.mi_mensajeria() and g.fecha_operativa = public.fecha_operativa()), 0)
  from public.envios e
  where private.mi_rol() = 'admin'
    and e.mensajeria_id = private.mi_mensajeria()
    and e.fecha_operativa = public.fecha_operativa()
$$;

-- metricas_diarias/semanales y kpis_hoy se recrearon (drop+create): reponer sus permisos.
revoke all on function
  public.metricas_diarias(int), public.metricas_semanales(int), public.metricas_mensuales(int),
  public.ranking_comercios(int), public.kpis_hoy()
from public, anon;
grant execute on function
  public.metricas_diarias(int), public.metricas_semanales(int), public.metricas_mensuales(int),
  public.ranking_comercios(int), public.kpis_hoy()
to authenticated;
