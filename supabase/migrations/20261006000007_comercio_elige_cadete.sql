-- El comercio puede elegir cadete al pedir (opcional). Antes se forzaba cadete_id=null
-- y dependía solo del cadete fijo; ahora, si lo elige, el pedido queda asignado directo.
create or replace function private.envios_antes_de_insertar() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_rol text := private.rol_app();
  v_comercio public.comercios%rowtype;
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
      -- Registrado por el cadete en la calle: ya lo retiró, falta que lo confirme el comercio.
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
      -- El cadete es opcional: si el comercio elige uno, el pedido ya queda asignado;
      -- si no, el de abajo completa con el cadete fijo (si tiene) o queda disponible.
      new.estado := case when new.cadete_id is null then 'solicitado' else 'asignado' end;
      new.confirmado := true;
    when v_rol = 'admin' then
      new.origen := 'admin';
      new.estado := case when new.cadete_id is null then 'solicitado' else 'asignado' end;
      new.confirmado := true;
    when v_rol is null then
      -- Interno (crear_envio_publico, service role): se respeta lo que viene.
      null;
    else
      raise exception 'Tu rol no puede crear envíos' using errcode = '42501';
  end case;

  -- Tarifa y comisión las define la base, nunca el cliente.
  select m.comision_cadete into new.comision
  from public.mensajerias m where m.id = new.mensajeria_id;

  if new.comercio_id is not null then
    select * into v_comercio from public.comercios c
    where c.id = new.comercio_id and c.mensajeria_id = new.mensajeria_id and c.activo;
    if not found then
      raise exception 'Comercio inexistente o inactivo' using errcode = '23503';
    end if;
    new.tarifa := v_comercio.tarifa;
    -- Pedido de comercio o admin sin cadete elegido: va al cadete fijo del comercio.
    if v_rol in ('comercio', 'admin') and new.cadete_id is null and v_comercio.cadete_fijo_id is not null
       and exists (select 1 from public.cadetes c where c.id = v_comercio.cadete_fijo_id and c.activo) then
      new.cadete_id := v_comercio.cadete_fijo_id;
      new.estado := 'asignado';
    end if;
  elsif v_rol is distinct from 'admin' and v_rol is not null then
    new.tarifa := 0;
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
