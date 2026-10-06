import Link from 'next/link'
import { Boton, Etiqueta, Tarjeta, inputClass } from '@/components/app/ui'
import { requireRol } from '@/lib/auth/perfil'
import { sumarDias } from '@/lib/semana'
import { createClient } from '@/lib/supabase/server'
import { EnvioCard, type EnvioRow } from '../envio-card'
import { ExportarEnviosCsv } from '../exportar-envios-csv'

const POR_PAGINA = 20

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string; pagina?: string }>
}) {
  const perfil = await requireRol('admin')
  const mensajeriaId = perfil.mensajeriaId as string
  const supabase = await createClient()
  const { desde: desdeParam, hasta: hastaParam, pagina: paginaParam } = await searchParams

  const { data: fechaHoy } = await supabase.rpc('fecha_operativa')
  const ayer = sumarDias(fechaHoy as unknown as string, -1)
  const desde = desdeParam || ayer
  const hasta = hastaParam || ayer
  const pagina = Math.max(0, Number(paginaParam) || 0)

  const [{ data: cadetes }, { data: envios }] = await Promise.all([
    supabase.from('cadetes').select('id, nombre').eq('activo', true).order('nombre'),
    supabase
      .from('envios')
      .select(
        'id, estado, direccion_destino, tarifa, comision, confirmado, origen, created_at, cadetes(nombre), comercios(nombre)',
      )
      .eq('mensajeria_id', mensajeriaId)
      .gte('fecha_operativa', desde)
      .lte('fecha_operativa', hasta)
      .order('created_at', { ascending: false })
      .range(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA),
  ])

  const hayMas = (envios ?? []).length > POR_PAGINA
  const enviosPagina = (envios ?? []).slice(0, POR_PAGINA)
  const queryBase = `desde=${desde}&hasta=${hasta}`

  return (
    <div className="grid gap-8">
      <header>
        <Etiqueta>HISTORIAL</Etiqueta>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Pedidos por fecha</h1>
      </header>

      <Tarjeta className="grid gap-3">
        <form className="flex flex-wrap items-end gap-3">
          <label className="grid gap-1 text-xs text-[var(--muted)]">
            Desde
            <input name="desde" type="date" defaultValue={desde} max={hastaParam || hasta} className={`${inputClass} h-10`} />
          </label>
          <label className="grid gap-1 text-xs text-[var(--muted)]">
            Hasta
            <input name="hasta" type="date" defaultValue={hasta} max={fechaHoy as unknown as string} className={`${inputClass} h-10`} />
          </label>
          <Boton type="submit" className="h-10 px-4 text-sm">Buscar</Boton>
        </form>
      </Tarjeta>

      <section className="grid gap-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Etiqueta>
            {desde === hasta ? desde : `${desde} → ${hasta}`} · {enviosPagina.length}
            {pagina > 0 || hayMas ? ` · página ${pagina + 1}` : ''}
          </Etiqueta>
          <ExportarEnviosCsv filas={enviosPagina} etiquetaFecha={desde === hasta ? desde : `${desde}_${hasta}`} />
        </div>

        {enviosPagina.length === 0 ? (
          <Tarjeta>
            <p className="text-sm text-[var(--muted)]">No hay pedidos en ese rango de fechas.</p>
          </Tarjeta>
        ) : (
          enviosPagina.map((e) => <EnvioCard key={e.id} envio={e as EnvioRow} cadetes={cadetes ?? []} />)
        )}

        {(pagina > 0 || hayMas) && (
          <div className="flex items-center justify-between gap-3">
            {pagina > 0 ? (
              <Link href={`/admin/historial?${queryBase}&pagina=${pagina - 1}`}>
                <Boton type="button" variante="secundario">← Anterior</Boton>
              </Link>
            ) : (
              <span />
            )}
            {hayMas && (
              <Link href={`/admin/historial?${queryBase}&pagina=${pagina + 1}`}>
                <Boton type="button" variante="secundario">Siguiente →</Boton>
              </Link>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
