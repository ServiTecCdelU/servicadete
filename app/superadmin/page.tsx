import Link from 'next/link'
import { Boton, Etiqueta, Tarjeta } from '@/components/app/ui'
import { createClient } from '@/lib/supabase/server'
import { cambiarEstadoMensajeria } from './actions'
import { NuevaMensajeria } from './nueva-mensajeria'

export default async function SuperadminPage() {
  const supabase = await createClient()
  const { data: mensajerias, error } = await supabase.rpc('mensajerias_con_envios_mes')

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Etiqueta>PANEL</Etiqueta>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Mensajerías</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">
            {mensajerias ? `${mensajerias.length} en total · envíos del mes en curso` : 'Cargando…'}
          </p>
        </div>
      </header>

      <NuevaMensajeria />

      {error ? (
        <Tarjeta>
          <p className="text-sm text-[var(--orange)]">No pudimos cargar las mensajerías. Recargá la página.</p>
        </Tarjeta>
      ) : mensajerias.length === 0 ? (
        <Tarjeta>
          <p className="text-sm text-[var(--muted)]">Todavía no hay mensajerías. Creá la primera arriba.</p>
        </Tarjeta>
      ) : (
        <ul className="grid gap-3">
          {mensajerias.map((m) => (
            <li key={m.id}>
              <Tarjeta className="flex flex-wrap items-center gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-block size-2 rounded-full ${m.activa ? 'bg-primary shadow-[0_0_10px_var(--lime)]' : 'bg-[var(--orange)]'}`}
                      aria-hidden
                    />
                    <h2 className="truncate text-lg font-bold tracking-tight">{m.nombre}</h2>
                    {!m.activa && (
                      <span className="rounded border border-[var(--orange)]/40 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-[var(--orange)]">
                        SUSPENDIDA
                      </span>
                    )}
                  </div>
                  <Link href={`/${m.slug}`} className="text-sm text-[var(--cyan)] hover:underline">
                    /{m.slug}
                  </Link>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold tracking-tight tabular-nums">{m.envios_mes}</p>
                  <p className="text-[10px] tracking-[.16em] text-[var(--muted)]">ENVÍOS DEL MES</p>
                </div>

                <form action={cambiarEstadoMensajeria}>
                  <input type="hidden" name="id" value={m.id} />
                  <input type="hidden" name="activa" value={String(!m.activa)} />
                  <Boton variante={m.activa ? 'peligro' : 'secundario'}>
                    {m.activa ? 'Suspender' : 'Activar'}
                  </Boton>
                </form>
              </Tarjeta>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
