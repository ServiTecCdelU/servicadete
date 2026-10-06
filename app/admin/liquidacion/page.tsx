import Link from 'next/link'
import { Boton, Etiqueta, Tarjeta } from '@/components/app/ui'
import { requireRol } from '@/lib/auth/perfil'
import { formatMonto } from '@/lib/format'
import { inicioSemana, sumarDias } from '@/lib/semana'
import { createClient } from '@/lib/supabase/server'
import { ExportarCsv } from './exportar-csv'

export default async function LiquidacionPage({
  searchParams,
}: {
  searchParams: Promise<{ fecha?: string }>
}) {
  const perfil = await requireRol('admin')
  const supabase = await createClient()
  const { fecha } = await searchParams

  const [{ data: mensajeria }, { data: fechaHoy }] = await Promise.all([
    supabase.from('mensajerias').select('dia_inicio_semana').eq('id', perfil.mensajeriaId as string).single(),
    supabase.rpc('fecha_operativa'),
  ])
  const diaInicio = mensajeria?.dia_inicio_semana ?? 1
  const fechaRef = fecha ?? (fechaHoy as unknown as string)
  const desde = inicioSemana(fechaRef, diaInicio)
  const hasta = sumarDias(desde, 6)

  const { data: liquidacion, error } = await supabase.rpc('liquidacion_semana', { p_fecha: desde })

  const semanaAnterior = sumarDias(desde, -7)
  const semanaSiguiente = sumarDias(desde, 7)
  const esSemanaActual = desde === inicioSemana(fechaHoy as unknown as string, diaInicio)

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Etiqueta>PAGOS A CADETES</Etiqueta>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {new Date(`${desde}T12:00:00Z`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
            {' – '}
            {new Date(`${hasta}T12:00:00Z`).toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/liquidacion?fecha=${semanaAnterior}`}>
            <Boton type="button" variante="secundario">← Anterior</Boton>
          </Link>
          {!esSemanaActual && (
            <Link href="/admin/liquidacion">
              <Boton type="button" variante="secundario">Hoy</Boton>
            </Link>
          )}
          <Link href={`/admin/liquidacion?fecha=${semanaSiguiente}`}>
            <Boton type="button" variante="secundario">Siguiente →</Boton>
          </Link>
        </div>
      </header>

      {error ? (
        <Tarjeta>
          <p className="text-sm text-[var(--orange)]">No pudimos cargar la liquidación. Recargá la página.</p>
        </Tarjeta>
      ) : (
        <>
          <div className="flex justify-end">
            <ExportarCsv filas={liquidacion ?? []} desde={desde} hasta={hasta} />
          </div>

          {!liquidacion || liquidacion.length === 0 ? (
            <Tarjeta>
              <p className="text-sm text-[var(--muted)]">No hay movimientos en esta semana.</p>
            </Tarjeta>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-[var(--panel)] text-left text-[10px] tracking-[.14em] text-[var(--muted)]">
                    <th className="px-4 py-3 font-medium">CADETE</th>
                    <th className="px-4 py-3 text-right font-medium">ENVÍOS</th>
                    <th className="px-4 py-3 text-right font-medium">GENERADO</th>
                    <th className="px-4 py-3 text-right font-medium">RENDIDO</th>
                    <th className="px-4 py-3 text-right font-medium">SALDO</th>
                  </tr>
                </thead>
                <tbody>
                  {liquidacion.map((f) => (
                    <tr key={f.cadete_id} className="border-b border-border last:border-0">
                      <td className="px-4 py-3">
                        {f.nombre} {!f.activo && <span className="text-xs text-[var(--muted)]">(inactivo)</span>}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">{f.envios}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMonto(f.a_rendir)}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{formatMonto(f.rendido)}</td>
                      <td className={`px-4 py-3 text-right font-bold tabular-nums ${f.saldo > 0 ? 'text-[var(--cyan)]' : ''}`}>
                        {formatMonto(f.saldo)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  )
}
