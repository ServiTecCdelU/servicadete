# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Estado del repo

- La landing se exportó de v0 y ya está descomprimida en la raíz; el `.zip` original queda ignorado por git. Se hace un commit por fase.
- `regla principal.md` es la **especificación completa** del producto (schema, reglas de negocio, pantallas, auth). Leerla antes de cualquier tarea; este archivo resume solo lo que más se olvida.
- Forma de trabajo pedida por el usuario: **mostrar un plan por fases y esperar su OK antes de codear**; commit al cerrar cada fase; preguntar antes de cualquier decisión que aumente lecturas o costo en Supabase/Vercel.

## Comandos

```bash
pnpm install
pnpm dev          # next dev
pnpm build        # next build
pnpm start
pnpm exec tsc --noEmit   # chequeo de tipos (ver nota abajo)
```

No hay scripts de lint ni tests todavía. `next.config.mjs` tiene `typescript.ignoreBuildErrors: true` (herencia de v0), así que `pnpm build` **no** detecta errores de tipos: correr `tsc --noEmit` explícitamente. La spec exige TypeScript estricto con tipos generados de Supabase (`supabase gen types typescript`).

## Stack

Next.js 16 (App Router) · React 19 · Tailwind 4 (vía `@tailwindcss/postcss`, sin `tailwind.config`) · shadcn estilo `base-nova` sobre `@base-ui/react` · framer-motion · lucide-react · pnpm. Alias `@/*` → raíz. A agregar: `@supabase/ssr` + `@supabase/supabase-js`.

## Landing (no tocar)

- `app/page.tsx` es un único client component con toda la landing. **No modificar su diseño**; el único cambio permitido es un botón "Ingresar" en la navbar que lleve a `/login`.
- Los estilos de la landing son clases propias en `app/globals.css` (`.navbar`, `.hero`, `.kpi-grid`, `.dashboard`…), no utilidades Tailwind. Los tokens de color están en `:root` (`--bg`, `--panel`, `--lime`, `--cyan`, `--orange`, `--muted`, `--line`) y mapeados a Tailwind en `@theme inline` (`bg-background`, `text-primary`, etc.). Las pantallas internas deben reutilizar estos tokens: dark, tarjetas tipo HUD, pero simples, mobile first, botones grandes y pocas animaciones.
- El WhatsApp de la landing (`5491100000000`) es un placeholder.

## Arquitectura objetivo (multi-tenant sobre Supabase)

- Tenant = `mensajerias`. Todas las tablas llevan `mensajeria_id` y tienen **RLS** que filtra según `perfiles` (`user_id` → `mensajeria_id`, `rol`). Roles: `superadmin | admin | cadete | comercio`.
- Migraciones SQL en `supabase/migrations/` (las corre el usuario, no ejecutarlas).
- Rutas: `/login` único que redirige por rol → `/superadmin`, `/admin`, `/cadete` (PWA), `/comercio`; pública `/[slug]` (pedido de particulares) y `/[slug]/envio/[id]` (seguimiento). Middleware protege por rol.
- Clientes Supabase: servidor y navegador con `@supabase/ssr`. `SUPABASE_SECRET_KEY` **solo** en server actions (alta de cadetes/comercios con usuario + PIN de 6 dígitos y email interno `usuario@slug.servicadete.local`). Env en `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`. Se usan las claves nuevas de Supabase (publishable/secret), que cumplen el rol de anon/service_role que nombra la spec.
- Auth solo email + contraseña; **nada de magic links** (cupo de email gratuito muy bajo).

### Lógica que vive en la base, no en el frontend

- Tarifa y comisión de un envío se copian por trigger (`comercios.tarifa`, `mensajerias.comision_cadete`); el cadete no puede editarlas.
- Envío creado por cadete → `estado='retirado'`, asignado a él, `confirmado=false`. Por comercio/admin → `confirmado=true`.
- Paso a `entregado` → movimiento `deuda` por `tarifa - comision` y actualización de `cadetes.saldo`. `rendicion` resta del saldo. El saldo **siempre** se lee de la columna, nunca sumando movimientos.
- "Tomar" un envío es una RPC atómica (`UPDATE … WHERE estado='solicitado'`).
- Formulario público `/[slug]`: insert vía RPC `security definer` (el rol `anon` no tiene permisos de tabla), con honeypot y límite por teléfono.

## Regla principal: consumo mínimo (plan gratuito)

- Nunca `select('*')`; pedir solo las columnas que muestra la pantalla. Joins en el select, sin N+1.
- Por defecto todo muestra **solo hoy**. Historial detrás de "Ver historial", con rango de fechas y paginado de 20 con `.range()`.
- "Hoy" = función SQL `fecha_operativa()` en `America/Argentina/Buenos_Aires`, usada en todo el proyecto (en UTC, los envíos desde las 21 h caerían al día siguiente).
- KPIs, liquidaciones y conteos se calculan en SQL (RPC) y devuelven totales; nunca traer filas para sumar en JS.
- Realtime: un canal por pantalla, filtrado por `mensajeria_id` o `cadete_id`, solo en "Hoy" del admin, app del cadete y seguimiento de envío. Desuscribir al desmontar y con `visibilitychange` oculto; al volver, refrescar una vez.
- Datos que cambian poco (comercios, tarifas, configuración): Server Components con caché, invalidados con `revalidateTag` al editar.
- Índices requeridos: `envios(mensajeria_id, fecha_operativa)`, `envios(cadete_id, estado)`, `movimientos(cadete_id, created_at)`.
- App del cadete: si no hay conexión, encolar la acción y reenviarla al volver. Push notifications quedan fuera de alcance por ahora.
