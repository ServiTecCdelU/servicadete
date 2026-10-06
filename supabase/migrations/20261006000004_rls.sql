-- RLS de las tablas operativas. Patrón: (select private.fn()) para que Postgres
-- evalúe el helper una vez por consulta y no por fila.

alter table public.cadetes     enable row level security;
alter table public.comercios   enable row level security;
alter table public.envios      enable row level security;
alter table public.movimientos enable row level security;

-- El anónimo no toca tablas: lo público pasa por RPCs security definer.
revoke all on public.cadetes, public.comercios, public.envios, public.movimientos from anon;

-- Columnas que la API puede escribir. saldo, created_at y similares quedan fuera:
-- solo los cambian triggers. Las altas con usuario las hace el servidor con la secret key.
revoke insert, update on public.cadetes, public.comercios, public.envios, public.movimientos from authenticated;
grant insert (mensajeria_id, nombre, telefono, dni, activo) on public.cadetes to authenticated;
grant update (nombre, telefono, dni, activo) on public.cadetes to authenticated;
grant insert (mensajeria_id, nombre, direccion, telefono, tarifa, cadete_fijo_id, activo) on public.comercios to authenticated;
grant update (nombre, direccion, telefono, tarifa, cadete_fijo_id, activo) on public.comercios to authenticated;
grant insert (mensajeria_id, comercio_id, cadete_id, origen, estado, tarifa, comision, direccion_destino, nota,
              nombre_contacto, telefono_contacto, direccion_origen) on public.envios to authenticated;
grant update (cadete_id, estado, tarifa, direccion_destino, nota, nombre_contacto, telefono_contacto,
              direccion_origen, confirmado, lat_retiro, lng_retiro, lat_entrega, lng_entrega) on public.envios to authenticated;
grant insert (mensajeria_id, cadete_id, tipo, monto, nota) on public.movimientos to authenticated;
revoke delete on public.cadetes, public.comercios, public.envios, public.movimientos from authenticated;

-- ── cadetes ───────────────────────────────────────────────────────────────

-- El comercio también puede ver los cadetes activos (para elegir uno al pedir).
create policy cadetes_select on public.cadetes for select to authenticated using (
  (mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'admin')
  or (mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'comercio' and activo)
  or perfil_id = (select auth.uid())
);

create policy cadetes_insert on public.cadetes for insert to authenticated with check (
  mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'admin'
);

create policy cadetes_update on public.cadetes for update to authenticated
  using (mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'admin')
  with check (mensajeria_id = (select private.mi_mensajeria()));

-- ── comercios ─────────────────────────────────────────────────────────────

-- El cadete ve los comercios activos de su mensajería (para registrar envíos y saber dónde retirar).
create policy comercios_select on public.comercios for select to authenticated using (
  (mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'admin')
  or (mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'cadete' and activo)
  or perfil_id = (select auth.uid())
);

create policy comercios_insert on public.comercios for insert to authenticated with check (
  mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'admin'
);

create policy comercios_update on public.comercios for update to authenticated
  using (mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'admin')
  with check (mensajeria_id = (select private.mi_mensajeria()));

-- ── envios ────────────────────────────────────────────────────────────────

create policy envios_select on public.envios for select to authenticated using (
  mensajeria_id = (select private.mi_mensajeria()) and (
    (select private.mi_rol()) = 'admin'
    or cadete_id = (select private.mi_cadete_id())
    -- Disponibles para tomar.
    or (estado = 'solicitado' and confirmado and (select private.mi_cadete_id()) is not null)
    or comercio_id = (select private.mi_comercio_id())
  )
);

-- Origen, estado, tarifa y comisión los fija el trigger según el rol.
create policy envios_insert on public.envios for insert to authenticated with check (
  mensajeria_id = (select private.mi_mensajeria())
  and (select private.mi_rol()) in ('admin', 'cadete', 'comercio')
);

create policy envios_update on public.envios for update to authenticated
  using (
    mensajeria_id = (select private.mi_mensajeria()) and (
      (select private.mi_rol()) = 'admin'
      or cadete_id = (select private.mi_cadete_id())
      or comercio_id = (select private.mi_comercio_id())
    )
  )
  with check (mensajeria_id = (select private.mi_mensajeria()));

-- ── movimientos ───────────────────────────────────────────────────────────

create policy movimientos_select on public.movimientos for select to authenticated using (
  (mensajeria_id = (select private.mi_mensajeria()) and (select private.mi_rol()) = 'admin')
  or cadete_id = (select private.mi_cadete_id())
);

-- El admin registra rendiciones; las deudas las genera el trigger de envíos.
create policy movimientos_insert on public.movimientos for insert to authenticated with check (
  mensajeria_id = (select private.mi_mensajeria())
  and (select private.mi_rol()) = 'admin'
  and tipo = 'rendicion'
);

-- ── Realtime (postgres_changes) ───────────────────────────────────────────
-- envios: "Hoy" del admin, app del cadete y del comercio. cadetes: saldo en vivo del cadete.
alter publication supabase_realtime add table public.envios, public.cadetes;
