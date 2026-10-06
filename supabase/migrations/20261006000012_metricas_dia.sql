-- Métricas de un día puntual (para el selector "día específico" del dashboard),
-- sin traer el rango completo de metricas_diarias.
create function public.metricas_dia(p_fecha date)
returns table (
  fecha date, envios bigint, entregados bigint, cancelados bigint,
  facturado numeric, comisiones numeric, gastos numeric, ganancia numeric
)
language plpgsql stable security definer set search_path = '' as $$
declare
  v_mensajeria uuid := private.mi_mensajeria();
  v_facturado numeric; v_comisiones numeric; v_gastos numeric;
begin
  if private.mi_rol() <> 'admin' then
    raise exception 'Solo el admin' using errcode = '42501';
  end if;

  select
    count(*) filter (where e.estado <> 'cancelado'),
    count(*) filter (where e.estado = 'entregado'),
    count(*) filter (where e.estado = 'cancelado'),
    coalesce(sum(e.tarifa) filter (where e.estado = 'entregado' and e.confirmado), 0),
    coalesce(sum(e.comision) filter (where e.estado = 'entregado' and e.confirmado), 0)
  into envios, entregados, cancelados, v_facturado, v_comisiones
  from public.envios e
  where e.mensajeria_id = v_mensajeria and e.fecha_operativa = p_fecha;

  select coalesce(sum(g.monto), 0) into v_gastos
  from public.gastos g where g.mensajeria_id = v_mensajeria and g.fecha_operativa = p_fecha;

  fecha := p_fecha;
  facturado := v_facturado;
  comisiones := v_comisiones;
  gastos := v_gastos;
  ganancia := v_facturado - v_comisiones - v_gastos;
  return next;
end $$;

revoke all on function public.metricas_dia(date) from public, anon;
grant execute on function public.metricas_dia(date) to authenticated;
