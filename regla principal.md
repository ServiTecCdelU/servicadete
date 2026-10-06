Se ejecutaron 2 comandos, archivo leído
Revisé el zip: es Next.js 16 con Tailwind 4, pnpm y framer-motion, con la marca ServiCadete. El prompt de abajo está armado sobre eso.

Antes, tres cosas que te conviene saber:

El WhatsApp de la landing es falso (5491100000000). Cambialo antes de publicar.
Vercel Hobby no permite uso comercial. Mientras estés probando, no hay problema, pero el día que le cobres al cliente tenés que pasar a Pro. Si no, te pueden dar de baja el proyecto.
Supabase gratis no tiene backups automáticos, y vas a guardar plata de cadetes. Hacé un backup manual semanal (pg_dump) desde el día 1.
Además, el prompt evita dos trampas típicas: el email de Supabase gratis está muy limitado por hora (por eso los cadetes entran con usuario y PIN, no con link mágico) y el "hoy" se calcula en hora de Argentina. Si lo calculás en UTC, los envíos de las 21 h en adelante caen en el día siguiente.

Contexto: este repo es la landing de ServiCadete (Next.js 16 App Router, Tailwind 4, pnpm, framer-motion), un SaaS multi-tenant de ServiTec para mensajerías y cadeterías. NO modifiques el diseño de la landing (app/page.tsx); solo agregá un botón "Ingresar" en la navbar que lleve a /login.

Tu tarea: construir la parte interna conectada a Supabase. Yo cargo las claves en .env.local:
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY (esta solo en el servidor, nunca en el cliente).

Antes de codear, mostrame un plan por fases y esperá mi OK. Trabajá fase por fase y hacé commit al cerrar cada una.

=== REGLA PRINCIPAL: CONSUMO MÍNIMO (plan gratuito de Supabase y Vercel) ===
- Nunca uses select('*'): pedí solo las columnas que muestra la pantalla.
- Por defecto, todo muestra SOLO EL DÍA DE HOY. El historial va detrás de un botón "Ver historial", con rango de fechas y paginado de a 20 con .range().
- "Hoy" se calcula en zona America/Argentina/Buenos_Aires, nunca en UTC. Creá una función SQL fecha_operativa() y usala en todo el proyecto.
- Los KPIs y las liquidaciones se calculan en SQL (funciones RPC) y devuelven totales; nunca traigas filas para sumarlas en JS.
- El saldo del cadete es una columna "saldo" en cadetes, mantenida por trigger. Nunca sumes todos los movimientos para mostrarlo.
- Realtime: un solo canal por pantalla, filtrado por mensajeria_id (o cadete_id), solo en "Hoy" del admin, en la app del cadete y en el seguimiento de un envío. Desuscribite al desmontar y cuando la pestaña quede oculta (visibilitychange); al volver, refrescá una vez.
- Los datos que cambian poco (comercios, tarifas, configuración) se leen en Server Components con caché e invalidación por revalidateTag al editarlos.
- Nada de consultas N+1: usá joins en el select de Supabase.
- Índices: envios(mensajeria_id, fecha_operativa), envios(cadete_id, estado), movimientos(cadete_id, created_at).

=== BASE DE DATOS ===
Generá las migraciones SQL en supabase/migrations/ (yo las corro). RLS activado en TODAS las tablas, filtrando por mensajeria_id según el perfil del usuario.

mensajerias: id, nombre, slug (único), logo_url, comision_cadete (default 1700), dia_inicio_semana, activa
perfiles: user_id (FK auth.users), mensajeria_id, rol ('superadmin'|'admin'|'cadete'|'comercio'), nombre
cadetes: id, mensajeria_id, perfil_id, nombre, telefono, dni, activo, saldo (numeric, default 0)
comercios: id, mensajeria_id, perfil_id (nullable), nombre, direccion, telefono, tarifa, cadete_fijo_id (nullable), activo
envios: id, mensajeria_id, comercio_id (nullable), cadete_id (nullable),
  origen ('comercio'|'cadete'|'admin'|'particular'),
  estado ('solicitado'|'asignado'|'retirado'|'entregado'|'cancelado'),
  tarifa, comision, direccion_destino, nota, nombre_contacto, telefono_contacto,
  confirmado (bool), fecha_operativa (date),
  lat_retiro, lng_retiro, lat_entrega, lng_entrega,
  created_at, asignado_at, retirado_at, entregado_at
movimientos: id, mensajeria_id, cadete_id, envio_id (nullable), tipo ('deuda'|'rendicion'), monto, nota, created_by, created_at

Reglas en la base (triggers o funciones, no en el frontend):
- Al crear un envío con comercio, la tarifa se copia de comercios.tarifa y la comisión de mensajerias.comision_cadete. El cadete no puede editarlas.
- Envío creado por un cadete: estado 'retirado', asignado a él, confirmado = false. Creado por comercio o admin: confirmado = true.
- Al pasar a 'entregado': insertar movimiento 'deuda' por (tarifa - comision) y actualizar cadetes.saldo.
- Al registrar una 'rendicion': restar del saldo.
- "Tomar" un envío debe ser atómico (RPC con UPDATE ... WHERE estado = 'solicitado'), para que dos cadetes no tomen el mismo.

=== AUTH ===
- Supabase Auth con email y contraseña. Nada de magic links (el email gratuito está muy limitado).
- Cadetes y comercios no se registran solos: los crea el admin desde su panel, con usuario + PIN de 6 dígitos (server action que usa la service role y genera un email interno del tipo usuario@slug.servicadete.local).
- /login es único: después de entrar, redirige según el rol (/superadmin, /admin, /cadete, /comercio).
- Proteger rutas con middleware según el rol.
- El superadmin lo creo yo a mano con un seed SQL.

=== PANTALLAS ===
Mismo estilo que la landing (dark, acentos, tarjetas HUD), pero SIMPLE: botones grandes, mobile first, pocas animaciones.

/admin
- Hoy: envíos del día agrupados por estado, en vivo. KPIs del día por RPC: envíos, entregados, a rendir.
- Botón "Nuevo envío" siempre visible: comercio, destino, nota y cadete opcional.
- Envíos sin confirmar, destacados para aprobar o rechazar.
- Cadetes: alta (genera usuario y PIN), switch activo/inactivo, saldo y "Registrar rendición".
- Comercios: alta, tarifa, cadete fijo y generación de acceso.
- Liquidación: semana seleccionable (por RPC), por cadete: envíos, a rendir, rendido y saldo. Exportar a CSV.
- Configuración: comisión, inicio de semana, slug y logo.

/cadete (PWA)
- Arriba, siempre visible: "Debés rendir: $X" y "Ganaste esta semana: $X".
- Envíos disponibles con el botón "Tomar".
- Envío activo: "Retiré" y después "Entregué" (guardá lat/lng si el navegador lo permite; si no, seguí igual).
- "+ Registrar envío": elegir comercio y listo.
- Si no hay conexión, encolá la acción y reenviala al volver.

/comercio
- Botón grande "Pedir cadete": destino y nota.
- Sus envíos de hoy con su estado en vivo.
- Confirmar o rechazar envíos registrados por cadetes desde su local.

/[slug] (pública, con el logo de la mensajería)
- Formulario para particulares: nombre, teléfono, origen, destino y nota.
- Insert mediante RPC security definer (no darle permisos de tabla al rol anon), con honeypot anti-spam y límite por teléfono.
- Después de enviarlo, redirige a /[slug]/envio/[id] con seguimiento en vivo.

/superadmin (mínimo)
- Lista de mensajerías: crear, activar o suspender, y cantidad de envíos del mes (por RPC).

=== PWA ===
manifest.json e íconos para que el cadete lo instale en la pantalla de inicio. Las notificaciones push quedan para una fase posterior: no las implementes ahora.

=== FORMA DE TRABAJO ===
- TypeScript estricto, tipos generados de Supabase.
- Usá @supabase/ssr para el cliente de servidor y de navegador.
- Ante cualquier decisión que aumente lecturas o costo, preguntame antes.