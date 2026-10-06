import { Boton, Etiqueta, Tarjeta } from '@/components/app/ui'
import { formatMonto } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { cambiarEstadoCadete } from './actions'
import { EditarCadete } from './editar-cadete'
import { NuevoCadete } from './nuevo-cadete'
import { RendicionForm } from './rendicion-form'

export default async function CadetesPage() {
  const supabase = await createClient()
  // Solo las columnas que se muestran; el saldo viene de la columna mantenida por trigger.
  const { data: cadetes, error } = await supabase
    .from('cadetes')
    .select('id, nombre, telefono, dni, activo, saldo')
    .order('activo', { ascending: false })
    .order('nombre')

  return (
    <div className="grid gap-8">
      <header>
        <Etiqueta>EQUIPO</Etiqueta>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Cadetes</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {cadetes ? `${cadetes.length} en total` : 'Cargando…'}
        </p>
      </header>

      <NuevoCadete />

      {error ? (
        <Tarjeta>
          <p className="text-sm text-[var(--orange)]">No pudimos cargar los cadetes. Recargá la página.</p>
        </Tarjeta>
      ) : cadetes.length === 0 ? (
        <Tarjeta>
          <p className="text-sm text-[var(--muted)]">Todavía no hay cadetes. Creá el primero arriba.</p>
        </Tarjeta>
      ) : (
        <ul className="grid gap-3">
          {cadetes.map((c) => (
            <li key={c.id}>
              <Tarjeta className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block size-2 rounded-full ${c.activo ? 'bg-primary shadow-[0_0_10px_var(--lime)]' : 'bg-[var(--orange)]'}`}
                      aria-hidden
                    />
                    <h2 className="truncate text-lg font-bold tracking-tight">{c.nombre}</h2>
                  </div>
                  {c.telefono && <p className="text-sm text-[var(--muted)]">{c.telefono}</p>}
                </div>

                <div className="text-right">
                  <p className={`text-2xl font-bold tracking-tight tabular-nums ${c.saldo > 0 ? 'text-[var(--cyan)]' : ''}`}>
                    {formatMonto(c.saldo)}
                  </p>
                  <p className="text-[10px] tracking-[.16em] text-[var(--muted)]">A RENDIR</p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {c.saldo > 0 && <RendicionForm cadeteId={c.id} />}
                  <EditarCadete cadete={c} />
                  <form action={cambiarEstadoCadete}>
                    <input type="hidden" name="id" value={c.id} />
                    <input type="hidden" name="activo" value={String(!c.activo)} />
                    <Boton variante={c.activo ? 'peligro' : 'secundario'} className="h-9 px-3 text-xs">
                      {c.activo ? 'Desactivar' : 'Activar'}
                    </Boton>
                  </form>
                </div>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
