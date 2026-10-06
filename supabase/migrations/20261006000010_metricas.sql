-- Métricas del admin: totales por día y por semana, calculados en SQL (nunca se
-- traen filas para sumarlas en JS). Ventanas acotadas por parámetro, sin límite.

create function public.metricas_diarias(p_dias int default 14)
returns table (
  fecha date, envios bigint, entregados bigint, cancelados bigint,
  facturado numeric, comisiones numeric
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if private.mi_rol() <> 'admin' then
    raise exception 'Solo el admin' using errcode = '42501';
  end if;
  if p_dias < 1 or p_dias > 92 then
    raise exception 'Rango inválido (1 a 92 días)' using errcode = '22023';
  end if;

  return query
  select d.fecha::date,
         count(e.id) filter (where e.estado <> 'cancelado'),
         count(e.id) filter (where e.estado = 'entregado'),
         count(e.id) filter (where e.estado = 'cancelado'),
         coalesce(sum(e.tarifa) filter (where e.estado = 'entregado' and e.confirmado), 0),
         coalesce(sum(e.comision) filter (where e.estado = 'entregado' and e.confirmado), 0)
  from generate_series(public.fecha_operativa() - (p_dias - 1), public.fecha_operativa(), interval '1 day') as d(fecha)
  left join public.envios e
    on e.fecha_operativa = d.fecha::date and e.mensajeria_id = private.mi_mensajeria()
  group by d.fecha::date
  order by d.fecha::date desc;
end $$;

create function public.metricas_semanales(p_semanas int default 8)
returns table (
  semana_inicio date, semana_fin date, envios bigint, entregados bigint,
  facturado numeric, comisiones numeric
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
  )
  select s.desde, s.desde + 6,
         count(e.id) filter (where e.estado <> 'cancelado'),
         count(e.id) filter (where e.estado = 'entregado'),
         coalesce(sum(e.tarifa) filter (where e.estado = 'entregado' and e.confirmado), 0),
         coalesce(sum(e.comision) filter (where e.estado = 'entregado' and e.confirmado), 0)
  from semanas s
  left join public.envios e
    on e.mensajeria_id = v_mensajeria and e.fecha_operativa >= s.desde and e.fecha_operativa < s.desde + 7
  group by s.desde
  order by s.desde desc;
end $$;

revoke all on function public.metricas_diarias(int), public.metricas_semanales(int) from public, anon;
grant execute on function public.metricas_diarias(int), public.metricas_semanales(int) to authenticated;
