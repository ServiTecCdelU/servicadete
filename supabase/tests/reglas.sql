-- Test de reglas de negocio, RLS y RPCs. Todo corre en una transacción que termina
-- en ROLLBACK: no deja datos. Si una aserción falla, la consulta devuelve el error.
-- Uso: pnpm db:query supabase/tests/reglas.sql
begin;

-- ── Fixtures (como postgres) ──────────────────────────────────────────────
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000000a1', 'admin1@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000a2', 'admin2@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000c1', 'cadete1@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000c2', 'cadete2@test.local', 'authenticated', 'authenticated'),
  ('00000000-0000-4000-8000-0000000000b1', 'comercio1@test.local', 'authenticated', 'authenticated');

insert into public.mensajerias (id, nombre, slug, comision_cadete) values
  ('10000000-0000-4000-8000-000000000001', 'Test Uno', 'test-uno', 1700),
  ('10000000-0000-4000-8000-000000000002', 'Test Dos', 'test-dos', 1700);

insert into public.perfiles (user_id, mensajeria_id, rol, nombre) values
  ('00000000-0000-4000-8000-0000000000a1', '10000000-0000-4000-8000-000000000001', 'admin', 'Admin Uno'),
  ('00000000-0000-4000-8000-0000000000a2', '10000000-0000-4000-8000-000000000002', 'admin', 'Admin Dos'),
  ('00000000-0000-4000-8000-0000000000c1', '10000000-0000-4000-8000-000000000001', 'cadete', 'Cadete Uno'),
  ('00000000-0000-4000-8000-0000000000c2', '10000000-0000-4000-8000-000000000001', 'cadete', 'Cadete Dos'),
  ('00000000-0000-4000-8000-0000000000b1', '10000000-0000-4000-8000-000000000001', 'comercio', 'Pizzería');

insert into public.cadetes (id, mensajeria_id, perfil_id, nombre) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000c1', 'Cadete Uno'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000c2', 'Cadete Dos');

insert into public.comercios (id, mensajeria_id, perfil_id, nombre, tarifa) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-0000000000b1', 'Pizzería', 3000);

-- ── 1. El comercio pide un cadete: tarifa y comisión las pone la base ─────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
set local role authenticated;

insert into public.envios (direccion_destino, tarifa, origen, estado)
values ('Destino Uno 123', 1, 'admin', 'entregado');

do $$ declare r record; begin
  select * into strict r from public.envios where direccion_destino = 'Destino Uno 123';
  assert r.origen = 'comercio', 'origen debería ser comercio';
  assert r.tarifa = 3000 and r.comision = 1700, 'tarifa/comisión copiadas de la base';
  assert r.estado = 'solicitado' and r.confirmado, 'pedido de comercio: solicitado y confirmado';
  assert r.fecha_operativa = public.fecha_operativa(), 'fecha operativa en hora AR';
end $$;

-- ── 2. Tomar es atómico: el segundo cadete no puede ───────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
set local role authenticated;

do $$ declare v uuid; begin
  select id into strict v from public.envios where direccion_destino = 'Destino Uno 123';
  perform public.tomar_envio(v);
  assert (select estado from public.envios where id = v) = 'asignado', 'cadete 1 tomó el envío';
end $$;

reset role;
select set_config('test.envio1', (select id::text from public.envios where direccion_destino = 'Destino Uno 123'), true);
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c2","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  assert (select count(*) from public.envios) = 0, 'cadete 2 no ve envíos ajenos ya tomados';
  begin
    perform public.tomar_envio(current_setting('test.envio1')::uuid);
    raise exception 'NO_FALLO';
  exception when others then
    if sqlerrm = 'NO_FALLO' then raise exception 'cadete 2 no debería poder tomar'; end if;
  end;
end $$;

-- ── 3. Retiré → Entregué genera la deuda y actualiza el saldo ─────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
set local role authenticated;

-- Las marcas de tiempo ni siquiera son columnas escribibles desde la API.
do $$ begin
  begin
    update public.envios set retirado_at = '2000-01-01' where direccion_destino = 'Destino Uno 123';
    raise exception 'NO_FALLO';
  exception when others then
    if sqlerrm = 'NO_FALLO' then raise exception 'el cliente no debería escribir retirado_at'; end if;
  end;
end $$;

update public.envios set estado = 'retirado', lat_retiro = -32.48, lng_retiro = -58.23
where direccion_destino = 'Destino Uno 123';
update public.envios set estado = 'entregado' where direccion_destino = 'Destino Uno 123';

do $$ declare r record; begin
  select * into strict r from public.envios where direccion_destino = 'Destino Uno 123';
  assert r.retirado_at > now() - interval '1 minute', 'retirado_at lo pone la base, no el cliente';
  assert r.entregado_at is not null, 'entregado_at seteado';
  assert (select saldo from public.cadetes where perfil_id = auth.uid()) = 1300, 'saldo = tarifa - comisión';
  assert (select count(*) from public.movimientos where tipo = 'deuda') = 1, 'una deuda';
end $$;

-- El cadete no puede tocar la tarifa ni su saldo.
do $$ begin
  begin
    update public.envios set tarifa = 1 where direccion_destino = 'Destino Uno 123';
    raise exception 'NO_FALLO';
  exception when others then
    if sqlerrm = 'NO_FALLO' then raise exception 'el cadete no debería cambiar la tarifa'; end if;
  end;
  begin
    update public.cadetes set saldo = 0;
    raise exception 'NO_FALLO';
  exception when others then
    if sqlerrm = 'NO_FALLO' then raise exception 'el cadete no debería cambiar su saldo'; end if;
  end;
end $$;

-- ── 4. Envío registrado por el cadete: queda sin confirmar ────────────────
insert into public.envios (comercio_id, direccion_destino)
values ('30000000-0000-4000-8000-000000000001', 'Destino Dos 456');

do $$ declare r record; begin
  select * into strict r from public.envios where direccion_destino = 'Destino Dos 456';
  assert r.origen = 'cadete' and r.estado = 'retirado' and not r.confirmado, 'registrado por cadete';
  assert r.cadete_id = '20000000-0000-4000-8000-000000000001', 'asignado al cadete que lo registró';
end $$;

-- Lo entrega antes de que lo confirmen: todavía no genera deuda.
update public.envios set estado = 'entregado' where direccion_destino = 'Destino Dos 456';
do $$ begin
  assert (select saldo from public.cadetes where perfil_id = auth.uid()) = 1300, 'sin confirmar no suma deuda';
end $$;

-- ── 5. El comercio confirma: recién ahí se genera la deuda ────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
set local role authenticated;

update public.envios set confirmado = true where direccion_destino = 'Destino Dos 456';

reset role;
do $$ begin
  assert (select saldo from public.cadetes where id = '20000000-0000-4000-8000-000000000001') = 2600,
    'confirmar un envío entregado genera la deuda';
end $$;

-- ── 6. Aislamiento entre mensajerías ──────────────────────────────────────
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}', true);
set local role authenticated;

do $$ begin
  assert (select count(*) from public.envios) = 0, 'admin de otra mensajería no ve envíos';
  assert (select count(*) from public.cadetes) = 0, 'admin de otra mensajería no ve cadetes';
  assert (select count(*) from public.kpis_hoy() where envios > 0) = 0, 'KPIs aislados';
end $$;

-- ── 7. Admin: rendición, KPIs y liquidación ───────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

insert into public.movimientos (cadete_id, tipo, monto)
values ('20000000-0000-4000-8000-000000000001', 'rendicion', 1000);

do $$ declare k record; l record; begin
  assert (select saldo from public.cadetes where id = '20000000-0000-4000-8000-000000000001') = 1600,
    'la rendición resta del saldo';
  select * into strict k from public.kpis_hoy();
  assert k.envios = 2 and k.entregados = 2 and k.a_rendir = 2600, format('kpis_hoy: %s', row_to_json(k));
  select * into strict l from public.liquidacion_semana() where cadete_id = '20000000-0000-4000-8000-000000000001';
  assert l.envios = 2 and l.a_rendir = 2600 and l.rendido = 1000 and l.saldo = 1600,
    format('liquidacion_semana: %s', row_to_json(l));
  begin
    insert into public.movimientos (cadete_id, tipo, monto)
    values ('20000000-0000-4000-8000-000000000001', 'deuda', 50);
    raise exception 'NO_FALLO';
  exception when others then
    if sqlerrm = 'NO_FALLO' then raise exception 'el admin no debería cargar deudas a mano'; end if;
  end;
  begin
    perform public.mensajerias_con_envios_mes();
    raise exception 'NO_FALLO';
  exception when others then
    if sqlerrm = 'NO_FALLO' then raise exception 'solo el superadmin lista mensajerías'; end if;
  end;
end $$;

-- ── 8. Resumen del cadete ─────────────────────────────────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
set local role authenticated;

do $$ declare r record; begin
  select * into strict r from public.resumen_cadete();
  assert r.debe_rendir = 1600 and r.ganado_semana = 3400, format('resumen_cadete: %s', row_to_json(r));
end $$;

-- ── 9. Público: pedido de particular, honeypot y límite por teléfono ──────
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;

do $$ declare v uuid; begin
  v := public.crear_envio_publico('test-uno', 'Ana', '343 154-000000', 'Origen 1', 'Destino 3');
  assert (select estado from public.seguimiento_envio(v)) = 'solicitado', 'seguimiento público';
  perform public.crear_envio_publico('test-uno', 'Ana', '343154000000', 'Origen 1', 'Destino 4');
  perform public.crear_envio_publico('test-uno', 'Ana', '343154000000', 'Origen 1', 'Destino 5');
  begin
    perform public.crear_envio_publico('test-uno', 'Ana', '343154000000', 'Origen 1', 'Destino 6');
    raise exception 'NO_FALLO';
  exception when others then
    if sqlerrm = 'NO_FALLO' then raise exception 'el límite por teléfono no funcionó'; end if;
  end;
  begin
    perform public.crear_envio_publico('test-uno', 'Bot', '1122334455', 'Origen', 'Destino', null, 'http://spam');
    raise exception 'NO_FALLO';
  exception when others then
    if sqlerrm = 'NO_FALLO' then raise exception 'el honeypot no funcionó'; end if;
  end;
  begin
    perform 1 from public.envios limit 1;
    raise exception 'NO_FALLO';
  exception when others then
    if sqlerrm = 'NO_FALLO' then raise exception 'anon no debería leer envios'; end if;
  end;
end $$;

-- ── 10. Superadmin y estado de la mensajería ──────────────────────────────
reset role;
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-4000-8000-0000000000d1', 'super@test.local', 'authenticated', 'authenticated');
insert into public.perfiles (user_id, mensajeria_id, rol, nombre) values
  ('00000000-0000-4000-8000-0000000000d1', null, 'superadmin', 'Super');

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  begin
    update public.mensajerias set activa = false;
    raise exception 'NO_FALLO';
  exception when others then
    if sqlerrm = 'NO_FALLO' then raise exception 'el admin no debería suspender su mensajería'; end if;
  end;
end $$;

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000d1","role":"authenticated"}', true);
set local role authenticated;
insert into public.mensajerias (nombre, slug) values ('Prueba SA', 'prueba-sa');
update public.mensajerias set activa = false where slug = 'test-uno';
do $$ declare r record; begin
  select * into strict r from public.mensajerias_con_envios_mes() where slug = 'test-uno';
  assert not r.activa and r.envios_mes = 5, format('superadmin lista con envíos del mes (2 + 3 particulares): %s', row_to_json(r));
  assert exists (select 1 from public.mensajerias_con_envios_mes() where slug = 'prueba-sa'), 'superadmin crea';
end $$;

-- Mensajería suspendida: su gente pierde acceso a los datos.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  assert (select count(*) from public.envios) = 0, 'mensajería suspendida no ve envíos';
end $$;

-- ── 11. El comercio elige cadete al pedir (opcional) ──────────────────────
reset role;
-- El paso 10 suspendió "test-uno"; se reactiva (como service_role) para seguir probando.
select set_config('request.jwt.claims', '{"role":"service_role"}', true);
update public.mensajerias set activa = true where slug = 'test-uno';

select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
set local role authenticated;

insert into public.envios (direccion_destino, cadete_id) values
  ('Destino Elegido 123', '20000000-0000-4000-8000-000000000002');
do $$ declare r record; begin
  select * into strict r from public.envios where direccion_destino = 'Destino Elegido 123';
  assert r.cadete_id = '20000000-0000-4000-8000-000000000002' and r.estado = 'asignado',
    format('comercio elige cadete al pedir: %s', row_to_json(r));
end $$;

insert into public.envios (direccion_destino) values ('Destino Sin Elegir 123');
do $$ declare r record; begin
  select * into strict r from public.envios where direccion_destino = 'Destino Sin Elegir 123';
  assert r.cadete_id is null and r.estado = 'solicitado', 'sin elegir cadete, sigue disponible para cualquiera';
end $$;

do $$ begin
  begin
    insert into public.envios (direccion_destino, cadete_id) values ('Destino Invalido', '99999999-0000-4000-8000-000000000000');
    raise exception 'NO_FALLO';
  exception when others then
    if sqlerrm = 'NO_FALLO' then raise exception 'no debería poder asignar un cadete inexistente'; end if;
  end;
end $$;

-- ── 12. El admin puede fijar la comisión al crear el envío; nadie más ─────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

insert into public.envios (comercio_id, direccion_destino, comision) values
  ('30000000-0000-4000-8000-000000000001', 'Destino Comision 123', 2000);
do $$ declare r record; begin
  select * into strict r from public.envios where direccion_destino = 'Destino Comision 123';
  assert r.comision = 2000 and r.tarifa = 3000, format('admin fija comisión: %s', row_to_json(r));
end $$;

do $$ begin
  begin
    insert into public.envios (comercio_id, direccion_destino, comision) values
      ('30000000-0000-4000-8000-000000000001', 'Destino Comision Invalida', 5000);
    raise exception 'NO_FALLO';
  exception when others then
    if sqlerrm = 'NO_FALLO' then raise exception 'la comisión no debería poder superar la tarifa'; end if;
  end;
end $$;

reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000b1","role":"authenticated"}', true);
set local role authenticated;
insert into public.envios (direccion_destino, comision) values ('Destino Comision Comercio 123', 9999999);
do $$ declare r record; begin
  select * into strict r from public.envios where direccion_destino = 'Destino Comision Comercio 123';
  assert r.comision = 1700, format('el comercio no puede alterar la comisión: %s', row_to_json(r));
end $$;

-- ── 13. Gastos, ganancia neta y ranking de comercios ──────────────────────
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated"}', true);
set local role authenticated;

insert into public.gastos (concepto, monto, nota) values ('Nafta', 1500, 'moto 1');
do $$ declare r record; begin
  select * into strict r from public.gastos where concepto = 'Nafta';
  assert r.mensajeria_id = '10000000-0000-4000-8000-000000000001' and r.fecha_operativa = public.fecha_operativa(),
    format('gasto: %s', row_to_json(r));
end $$;

do $$ declare k record; d record; begin
  select * into strict k from public.kpis_hoy();
  assert k.gastos = 1500 and k.ganancia = k.a_rendir - k.gastos,
    format('kpis_hoy con gastos: %s', row_to_json(k));

  select * into strict d from public.metricas_diarias(1);
  assert d.gastos = 1500 and d.ganancia = d.facturado - d.comisiones - d.gastos,
    format('metricas_diarias: %s', row_to_json(d));
end $$;

do $$ declare r record; begin
  select * into strict r from public.ranking_comercios(30) where nombre = 'Pizzería';
  assert r.entregados = 2 and r.facturado = 6000, format('ranking_comercios: %s', row_to_json(r));
end $$;

-- Nadie más puede registrar gastos ni ver los de la mensajería.
reset role;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-0000000000c1","role":"authenticated"}', true);
set local role authenticated;
do $$ begin
  assert (select count(*) from public.gastos) = 0, 'el cadete no ve los gastos';
  begin
    insert into public.gastos (concepto, monto) values ('Intento', 100);
    raise exception 'NO_FALLO';
  exception when others then
    if sqlerrm = 'NO_FALLO' then raise exception 'el cadete no debería poder registrar gastos'; end if;
  end;
end $$;

reset role;
select 'TODOS LOS TESTS PASARON' as resultado;
rollback;
