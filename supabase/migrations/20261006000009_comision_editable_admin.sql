-- El admin puede fijar la comisión del cadete por envío (el formulario la precarga
-- con la de la mensajería). Cualquier otro rol siempre usa la de la mensajería.
grant insert (comision) on public.envios to authenticated;

create or replace function private.envios_antes_de_insertar() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_rol text := private.rol_app();
  v_comercio public.comercios%rowtype;
  v_comision_default numeric;
begin
  new.fecha_operativa := public.fecha_operativa();
  new.created_at := now();
  new.asignado_at := null; new.retirado_at := null; new.entregado_at := null;

  if v_rol is not null then
    new.mensajeria_id := private.mi_mensajeria();
    if new.mensajeria_id is null then
      raise exception 'Sin mensajería activa' using errcode = '42501';
    end if;
  end if;

  case
    when v_rol = 'cadete' then
      if new.comercio_id is null then
        raise exception 'Elegí el comercio del envío' using errcode = '22023';
      end if;
      new.origen := 'cadete';
      new.cadete_id := private.mi_cadete_id();
      if new.cadete_id is null then
        raise exception 'Tu usuario de cadete no está activo' using errcode = '42501';
      end if;
      new.estado := 'retirado';
      new.confirmado := false;
    when v_rol = 'comercio' then
      new.origen := 'comercio';
      new.comercio_id := private.mi_comercio_id();
      if new.comercio_id is null then
        raise exception 'Tu comercio no está activo' using errcode = '42501';
      end if;
      new.estado := case when new.cadete_id is null then 'solicitado' else 'asignado' end;
      new.confirmado := true;
    when v_rol = 'admin' then
      new.origen := 'admin';
      new.estado := case when new.cadete_id is null then 'solicitado' else 'asignado' end;
      new.confirmado := true;
    when v_rol is null then
      null;
    else
      raise exception 'Tu rol no puede crear envíos' using errcode = '42501';
  end case;

  -- Tarifa: la define la base según el comercio, nunca el cliente.
  if new.comercio_id is not null then
    select * into v_comercio from public.comercios c
    where c.id = new.comercio_id and c.mensajeria_id = new.mensajeria_id and c.activo;
    if not found then
      raise exception 'Comercio inexistente o inactivo' using errcode = '23503';
    end if;
    new.tarifa := v_comercio.tarifa;
    if v_rol in ('comercio', 'admin') and new.cadete_id is null and v_comercio.cadete_fijo_id is not null
       and exists (select 1 from public.cadetes c where c.id = v_comercio.cadete_fijo_id and c.activo) then
      new.cadete_id := v_comercio.cadete_fijo_id;
      new.estado := 'asignado';
    end if;
  elsif v_rol is distinct from 'admin' and v_rol is not null then
    new.tarifa := 0;
  end if;

  -- Comisión: el admin puede fijarla por envío; cualquier otro rol siempre usa la
  -- de la mensajería (el cadete no puede inflarla para deberle menos a la mensajería).
  select m.comision_cadete into v_comision_default
  from public.mensajerias m where m.id = new.mensajeria_id;

  if v_rol = 'admin' then
    if new.comision < 0 or new.comision > new.tarifa then
      raise exception 'La comisión debe estar entre 0 y la tarifa' using errcode = '22023';
    end if;
  else
    new.comision := v_comision_default;
  end if;

  if new.cadete_id is not null and not exists (
    select 1 from public.cadetes c
    where c.id = new.cadete_id and c.mensajeria_id = new.mensajeria_id and c.activo
  ) then
    raise exception 'El cadete no está activo' using errcode = '22023';
  end if;

  if new.estado in ('asignado', 'retirado') then new.asignado_at := now(); end if;
  if new.estado = 'retirado' then new.retirado_at := now(); end if;
  return new;
end $$;
