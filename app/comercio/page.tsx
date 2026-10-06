import { RealtimeRefresh } from '@/components/app/realtime-refresh'
import { Etiqueta, Tarjeta } from '@/components/app/ui'
import { createClient } from '@/lib/supabase/server'
import { EnvioRow, type EnvioComercioRow } from './envio-row'
import { PedirCadete } from './pedir-cadete'

export default async function ComercioPage() {
  const supabase = await createClient()

  const { data: comercio } = await supabase
    .from('comercios')
    .select('id, nombre, activo')
    .eq('perfil_id', (await supabase.auth.getClaims()).data?.claims.sub as string)
    .single()

  if (!comercio) {
    return (
      <Tarjeta>
        <p className="text-sm text-[var(--orange)]">Tu usuario no está vinculado a ningún comercio. Pedile al admin que te genere el acceso de nuevo.</p>
      </Tarjeta>
    )
  }

  if (!comercio.activo) {
    return (
      <Tarjeta>
        <p className="text-sm text-[var(--orange)]">Tu comercio está desactivado. Hablá con la mensajería.</p>
      </Tarjeta>
    )
  }

  const { data: fechaHoy } = await supabase.rpc('fecha_operativa')
  const { data: envios } = await supabase
    .from('envios')
    .select('id, estado, direccion_destino, tarifa, confirmado, origen, created_at, cadetes(nombre)')
    .eq('comercio_id', comercio.id)
    .eq('fecha_operativa', fechaHoy as unknown as string)
    .order('created_at', { ascending: false })

  return (
    <div className="grid gap-8">
      <RealtimeRefresh channelName="comercio-hoy" table="envios" filterColumn="comercio_id" filterValue={comercio.id} />

      <header>
        <Etiqueta>{comercio.nombre.toUpperCase()}</Etiqueta>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Pedir cadete</h1>
      </header>

      <PedirCadete />

      <section className="grid gap-3">
        <Etiqueta>HOY · {envios?.length ?? 0}</Etiqueta>
        {!envios || envios.length === 0 ? (
          <Tarjeta>
            <p className="text-sm text-[var(--muted)]">Todavía no pediste ningún cadete hoy.</p>
          </Tarjeta>
        ) : (
          envios.map((e) => <EnvioRow key={e.id} envio={e as EnvioComercioRow} />)
        )}
      </section>
    </div>
  )
}
