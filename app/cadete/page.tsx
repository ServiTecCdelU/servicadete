import { RealtimeRefresh } from '@/components/app/realtime-refresh'
import { Etiqueta, Tarjeta } from '@/components/app/ui'
import { requireRol } from '@/lib/auth/perfil'
import { createClient } from '@/lib/supabase/server'
import { EnvioActivo, type EnvioActivoRow } from './envio-activo'
import { EnvioDisponible, type EnvioDisponibleRow } from './envio-disponible'
import { RegistrarEnvio } from './registrar-envio'
import { ResumenCadete } from './resumen-cadete'

export default async function CadetePage() {
  const perfil = await requireRol('cadete')
  const supabase = await createClient()

  const [{ data: resumen }, { data: activos }, { data: disponibles }, { data: comercios }] = await Promise.all([
    supabase.rpc('resumen_cadete').single(),
    supabase
      .from('envios')
      .select('id, estado, direccion_destino, tarifa, comision, nota, comercios(nombre, direccion)')
      .in('estado', ['asignado', 'retirado'])
      .order('asignado_at', { ascending: true }),
    supabase
      .from('envios')
      .select('id, direccion_destino, tarifa, comision, nota, comercios(nombre, direccion)')
      .eq('estado', 'solicitado')
      .order('created_at', { ascending: true }),
    supabase.from('comercios').select('id, nombre').eq('activo', true).order('nombre'),
  ])

  return (
    <div className="grid gap-6">
      <RealtimeRefresh
        channelName="cadete-envios"
        table="envios"
        filterColumn="mensajeria_id"
        filterValue={perfil.mensajeriaId as string}
      />

      <ResumenCadete debeRendir={resumen?.debe_rendir ?? 0} ganadoSemana={resumen?.ganado_semana ?? 0} />

      {activos && activos.length > 0 && (
        <section className="grid gap-3">
          {activos.map((e) => (
            <EnvioActivo key={e.id} envio={e as EnvioActivoRow} />
          ))}
        </section>
      )}

      <RegistrarEnvio comercios={comercios ?? []} />

      <section className="grid gap-3">
        <Etiqueta>ENVÍOS DISPONIBLES</Etiqueta>
        {!disponibles || disponibles.length === 0 ? (
          <Tarjeta>
            <p className="text-sm text-[var(--muted)]">No hay envíos disponibles ahora. Volvé a mirar en un rato.</p>
          </Tarjeta>
        ) : (
          disponibles.map((e) => <EnvioDisponible key={e.id} envio={e as EnvioDisponibleRow} />)
        )}
      </section>
    </div>
  )
}
