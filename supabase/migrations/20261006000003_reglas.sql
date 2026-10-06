-- Reglas de negocio en la base: el frontend no puede saltearlas.

-- ── Helpers de identidad operativa ────────────────────────────────────────

create function private.mi_cadete_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select c.id from public.cadetes c
  where c.perfil_id = auth.uid() and c.activo
    and c.mensajeria_id = private.mi_mensajeria()
$$;

create function private.mi_comercio_id() returns uuid
language sql stable security definer set search_path = '' as $$
  select c.id from public.comercios c
  where c.perfil_id = auth.uid() and c.activo
    and c.mensajeria_id = private.mi_mensajeria()
$$;

revoke all on function private.mi_cadete_id(), private.mi_comercio_id() from public, anon;
grant execute on function private.mi_cadete_id(), private.mi_comercio_id() to authenticated;

-- Llamadas internas (RPC security definer, service role, SQL directo) no tienen rol de app.
create function private.rol_app() returns text
language sql stable set search_path = '' as $$
  select case when auth.uid() is null then null else private.mi_rol() end
$$;

-- ── envios: alta ──────────────────────────────────────────────────────────

create function private.envios_antes_de_insertar() returns trigger
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

  -- Tarifa: la define la base según el comercio, nunca el cliente.
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

  -- Comisión: el admin puede fijarla por envío (el formulario la manda siempre,
  -- precargada con la de la mensajería); cualquier otro rol siempre usa la de la
  -- mensajería, así el cadete no puede inflarla para deberle menos a la mensajería.
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

create trigger envios_antes_de_insertar
  before insert on public.envios
  for each row execute function private.envios_antes_de_insertar();

-- ── envios: cambios ───────────────────────────────────────────────────────

-- Transiciones válidas para cualquiera. "cancelado" se controla aparte por rol.
create function private.transicion_valida(p_de text, p_a text) returns boolean
language sql immutable set search_path = '' as $$
  select p_de = p_a or (p_de, p_a) in (
    ('solicitado', 'asignado'), ('asignado', 'solicitado'),
    ('asignado', 'retirado'), ('retirado', 'entregado')
  )
$$;

create function private.envios_antes_de_actualizar() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_rol text := private.rol_app();
  v_tomando boolean := coalesce(current_setting('servicadete.tomar_envio', true), '') = new.id::text;
begin
  -- Inmutables para todos.
  if new.mensajeria_id <> old.mensajeria_id or new.origen <> old.origen
     or new.comision <> old.comision or new.fecha_operativa <> old.fecha_operativa
     or new.created_at <> old.created_at then
    raise exception 'Ese dato del envío no se puede cambiar' using errcode = '42501';
  end if;

  -- Un envío cancelado no vuelve; uno entregado solo se puede rechazar si nunca se confirmó.
  if old.estado = 'cancelado' and new.estado <> 'cancelado' then
    raise exception 'El envío está cancelado' using errcode = '22023';
  end if;
  if old.estado = 'entregado' and new.estado not in ('entregado', 'cancelado') then
    raise exception 'El envío ya fue entregado' using errcode = '22023';
  end if;
  if old.estado = 'entregado' and new.estado = 'cancelado' and old.confirmado then
    raise exception 'Un envío entregado y confirmado no se puede cancelar' using errcode = '22023';
  end if;
  if new.estado <> 'cancelado' and old.estado <> 'entregado'
     and not private.transicion_valida(old.estado, new.estado) then
    raise exception 'No se puede pasar de % a %', old.estado, new.estado using errcode = '22023';
  end if;

  if v_rol = 'cadete' then
    if new.comercio_id is distinct from old.comercio_id or new.tarifa <> old.tarifa
       or new.direccion_destino <> old.direccion_destino or new.nota is distinct from old.nota
       or new.direccion_origen is distinct from old.direccion_origen
       or new.nombre_contacto is distinct from old.nombre_contacto
       or new.telefono_contacto is distinct from old.telefono_contacto
       or new.confirmado <> old.confirmado then
      raise exception 'El cadete solo puede actualizar el estado del envío' using errcode = '42501';
    end if;
    if new.estado = 'cancelado' or (old.estado = 'solicitado' and not v_tomando)
       or (new.estado = 'solicitado' and old.estado <> 'solicitado') then
      raise exception 'Acción no permitida para el cadete' using errcode = '42501';
    end if;
    if new.cadete_id is distinct from old.cadete_id and not v_tomando then
      raise exception 'El cadete no puede reasignar envíos' using errcode = '42501';
    end if;
  elsif v_rol = 'comercio' then
    -- El comercio solo confirma o rechaza lo que un cadete registró desde su local.
    if old.confirmado or old.origen <> 'cadete' then
      raise exception 'El comercio solo puede confirmar o rechazar envíos sin confirmar' using errcode = '42501';
    end if;
    if new.comercio_id is distinct from old.comercio_id or new.cadete_id is distinct from old.cadete_id
       or new.tarifa <> old.tarifa or new.direccion_destino <> old.direccion_destino
       or new.nota is distinct from old.nota
       or (new.estado <> old.estado and new.estado <> 'cancelado')
       or (new.confirmado and new.estado = 'cancelado') then
      raise exception 'Acción no permitida para el comercio' using errcode = '42501';
    end if;
  elsif v_rol = 'admin' then
    if new.comercio_id is distinct from old.comercio_id then
      raise exception 'El comercio de un envío no se cambia: cancelalo y creá otro' using errcode = '22023';
    end if;
    if old.estado = 'entregado' and new.tarifa <> old.tarifa then
      raise exception 'La tarifa de un envío entregado no se cambia' using errcode = '22023';
    end if;
  elsif v_rol is not null then
    raise exception 'Tu rol no puede modificar envíos' using errcode = '42501';
  end if;

  if new.estado = 'solicitado' then new.cadete_id := null; end if;
  if new.estado in ('asignado', 'retirado', 'entregado') and new.cadete_id is null then
    raise exception 'Asigná un cadete primero' using errcode = '22023';
  end if;

  if new.cadete_id is distinct from old.cadete_id and new.cadete_id is not null and not exists (
    select 1 from public.cadetes c
    where c.id = new.cadete_id and c.mensajeria_id = new.mensajeria_id and c.activo
  ) then
    raise exception 'El cadete no está activo' using errcode = '22023';
  end if;

  -- Las marcas de tiempo las pone la base: se ignora lo que mande el cliente.
  new.asignado_at := old.asignado_at;
  new.retirado_at := old.retirado_at;
  new.entregado_at := old.entregado_at;
  if new.estado <> old.estado then
    case new.estado
      when 'solicitado' then new.asignado_at := null;
      when 'asignado'   then new.asignado_at := now();
      when 'retirado'   then new.retirado_at := now();
      when 'entregado'  then new.entregado_at := now();
      else null;
    end case;
  elsif new.cadete_id is distinct from old.cadete_id then
    new.asignado_at := now();
  end if;
  return new;
end $$;

create trigger envios_antes_de_actualizar
  before update on public.envios
  for each row execute function private.envios_antes_de_actualizar();

-- Entregado + confirmado ⇒ el cadete debe (tarifa − comisión). Se dispara una sola vez:
-- movimientos.envio_id es único.
create function private.envios_generar_deuda() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.estado = 'entregado' and new.confirmado
     and not (old.estado = 'entregado' and old.confirmado)
     and new.tarifa - new.comision > 0 then
    insert into public.movimientos (mensajeria_id, cadete_id, envio_id, tipo, monto, nota, created_by)
    values (new.mensajeria_id, new.cadete_id, new.id, 'deuda', new.tarifa - new.comision, null, auth.uid())
    on conflict (envio_id) do nothing;
  end if;
  return null;
end $$;

create trigger envios_generar_deuda
  after update of estado, confirmado on public.envios
  for each row execute function private.envios_generar_deuda();

-- Seguimiento público: un broadcast por envío de particular, al canal envio:<uuid>.
-- El anónimo no lee la tabla; solo recibe estos eventos.
create function private.envios_broadcast_seguimiento() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.origen = 'particular' and new.estado is distinct from old.estado then
    perform realtime.send(
      jsonb_build_object(
        'estado', new.estado,
        'asignado_at', new.asignado_at,
        'retirado_at', new.retirado_at,
        'entregado_at', new.entregado_at
      ),
      'estado', 'envio:' || new.id::text, false
    );
  end if;
  return null;
end $$;

create trigger envios_broadcast_seguimiento
  after update of estado on public.envios
  for each row execute function private.envios_broadcast_seguimiento();

-- ── movimientos → saldo ───────────────────────────────────────────────────

create function private.movimientos_antes_de_insertar() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.created_at := now();
  if private.rol_app() = 'admin' then
    new.mensajeria_id := private.mi_mensajeria();
    new.created_by := auth.uid();
    if new.tipo <> 'rendicion' then
      raise exception 'Solo se registran rendiciones a mano' using errcode = '42501';
    end if;
  end if;
  return new;
end $$;

create trigger movimientos_antes_de_insertar
  before insert on public.movimientos
  for each row execute function private.movimientos_antes_de_insertar();

create function private.movimientos_actualizar_saldo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  update public.cadetes
  set saldo = saldo + case new.tipo when 'deuda' then new.monto else -new.monto end
  where id = new.cadete_id;
  return null;
end $$;

create trigger movimientos_actualizar_saldo
  after insert on public.movimientos
  for each row execute function private.movimientos_actualizar_saldo();

revoke all on function
  private.envios_antes_de_insertar(), private.envios_antes_de_actualizar(),
  private.envios_generar_deuda(), private.envios_broadcast_seguimiento(),
  private.movimientos_antes_de_insertar(), private.movimientos_actualizar_saldo()
from public, anon, authenticated;
