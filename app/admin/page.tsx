import { RealtimeRefresh } from '@/components/app/realtime-refresh'
import { Etiqueta, Tarjeta } from '@/components/app/ui'
import { requireRol } from '@/lib/auth/perfil'
import { formatMonto } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { EnvioCard, type EnvioRow } from './envio-card'
import { NuevoEnvio } from './nuevo-envio'

const ORDEN_ESTADO = ['solicitado', 'asignado', 'retirado', 'entregado', 'cancelado']

export default async function AdminHoyPage() {
  const perfil = await requireRol('admin')
  const mensajeriaId = perfil.mensajeriaId as string
  const supabase = await createClient()

  const [{ data: kpis }, { data: fechaHoy }, { data: comercios }, { data: cadetes }, { data: mensajeria }] = await Promise.all([
    supabase.rpc('kpis_hoy').single(),
    supabase.rpc('fecha_operativa'),
    supabase.from('comercios').select('id, nombre, tarifa').eq('activo', true).order('nombre'),
    supabase.from('cadetes').select('id, nombre').eq('activo', true).order('nombre'),
    supabase.from('mensajerias').select('comision_cadete').eq('id', mensajeriaId).single(),
  ])

  const { data: envios } = await supabase
    .from('envios')
    .select(
      'id, estado, direccion_destino, tarifa, comision, confirmado, origen, created_at, cadetes(nombre), comercios(nombre)',
    )
    .eq('mensajeria_id', mensajeriaId)
    .eq('fecha_operativa', fechaHoy as unknown as string)
    .order('created_at', { ascending: false })

  const enviosOrdenados = [...(envios ?? [])].sort(
    (a, b) => ORDEN_ESTADO.indexOf(a.estado) - ORDEN_ESTADO.indexOf(b.estado),
  )
  const sinConfirmar = enviosOrdenados.filter((e) => !e.confirmado && e.estado !== 'cancelado')
  const resto = enviosOrdenados.filter((e) => e.confirmado || e.estado === 'cancelado')

  return (
    <div className="grid gap-8">
      <RealtimeRefresh channelName="admin-hoy" table="envios" filterColumn="mensajeria_id" filterValue={mensajeriaId} />

      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-extrabold tracking-[.2em] text-[var(--muted)]">
            <span className="size-2 rounded-full bg-primary shadow-[0_0_12px_rgba(183,243,75,.65)]" />
            HOY · EN VIVO
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Tu operación</h1>
        </div>
        <NuevoEnvio comercios={comercios ?? []} cadetes={cadetes ?? []} comisionDefault={mensajeria?.comision_cadete ?? 0} />
      </header>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Tarjeta className="min-w-0 p-3 text-center sm:p-4">
          <p className="truncate text-lg font-bold tabular-nums sm:text-2xl md:text-3xl">{kpis?.envios ?? 0}</p>
          <p className="mt-1 text-[9px] tracking-[.14em] text-[var(--muted)] sm:text-[10px] sm:tracking-[.16em]">ENVÍOS</p>
        </Tarjeta>
        <Tarjeta className="min-w-0 p-3 text-center sm:p-4">
          <p className="truncate text-lg font-bold tabular-nums text-primary sm:text-2xl md:text-3xl">{kpis?.entregados ?? 0}</p>
          <p className="mt-1 text-[9px] tracking-[.14em] text-[var(--muted)] sm:text-[10px] sm:tracking-[.16em]">ENTREGADOS</p>
        </Tarjeta>
        <Tarjeta className="min-w-0 p-3 text-center sm:p-4">
          <p className="truncate text-lg font-bold tabular-nums text-[var(--cyan)] sm:text-2xl md:text-3xl">{formatMonto(kpis?.a_rendir ?? 0)}</p>
          <p className="mt-1 text-[9px] tracking-[.14em] text-[var(--muted)] sm:text-[10px] sm:tracking-[.16em]">SALDO PENDIENTE</p>
        </Tarjeta>
      </div>

      {sinConfirmar.length > 0 && (
        <section className="grid gap-3">
          <Etiqueta>SIN CONFIRMAR · {sinConfirmar.length}</Etiqueta>
          {sinConfirmar.map((e) => (
            <EnvioCard key={e.id} envio={e as EnvioRow} cadetes={cadetes ?? []} />
          ))}
        </section>
      )}

      <section className="grid gap-3">
        <Etiqueta>ENVÍOS DE HOY · {resto.length}</Etiqueta>
        {resto.length === 0 ? (
          <Tarjeta>
            <p className="text-sm text-[var(--muted)]">Todavía no hay envíos hoy.</p>
          </Tarjeta>
        ) : (
          resto.map((e) => <EnvioCard key={e.id} envio={e as EnvioRow} cadetes={cadetes ?? []} />)
        )}
      </section>
    </div>
  )
}
