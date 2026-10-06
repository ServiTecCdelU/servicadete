import { BarrasRanking } from '@/components/app/charts'
import { Etiqueta, Tarjeta } from '@/components/app/ui'
import { formatMonto } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { DashboardPeriodo } from './dashboard-periodo'
import { DiaEspecifico } from './dia-especifico'
import { RegistrarGasto } from './registrar-gasto'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fmtFecha = (iso: string) => { const [, m, d] = iso.split('-'); return `${d}/${m}` }
const fmtMes = (iso: string) => MESES[Number(iso.split('-')[1]) - 1]

export const dynamic = 'force-dynamic'

export default async function MetricasPage() {
  const supabase = await createClient()

  let diarias: any[] | null = null
  let semanales: any[] | null = null
  let mensuales: any[] | null = null
  let ranking: any[] | null = null
  let fechaHoy: unknown = null
  let errDiarias: unknown = null

  try {
    const resultados = await Promise.all([
      supabase.rpc('metricas_diarias', { p_dias: 14 }),
      supabase.rpc('metricas_semanales', { p_semanas: 8 }),
      supabase.rpc('metricas_mensuales', { p_meses: 6 }),
      supabase.rpc('ranking_comercios', { p_dias: 30 }),
      supabase.rpc('fecha_operativa'),
    ])

    diarias = resultados[0].data
    errDiarias = resultados[0].error
    semanales = resultados[1].data
    mensuales = resultados[2].data
    ranking = resultados[3].data
    fechaHoy = resultados[4].data
  } catch (error) {
    console.error('[metricas] error al cargar dashboard', error)
    errDiarias = error
  }

  const hoy = diarias?.[0]
  const estaSemana = semanales?.[0]
  const esteMes = mensuales?.[0]

  const dias = (diarias ?? []).map((d) => ({
    etiqueta: fmtFecha(String(d.fecha)),
    envios: Number(d.envios ?? 0),
    entregados: Number(d.entregados ?? 0),
    facturado: Number(d.facturado ?? 0),
    comisiones: Number(d.comisiones ?? 0),
    gastos: Number(d.gastos ?? 0),
    ganancia: Number(d.ganancia ?? 0),
  }))

  const semanas = (semanales ?? []).map((s) => ({
    etiqueta: `${fmtFecha(String(s.semana_inicio))}–${fmtFecha(String(s.semana_fin))}`,
    envios: Number(s.envios ?? 0),
    entregados: Number(s.entregados ?? 0),
    facturado: Number(s.facturado ?? 0),
    comisiones: Number(s.comisiones ?? 0),
    gastos: Number(s.gastos ?? 0),
    ganancia: Number(s.ganancia ?? 0),
  }))

  const meses = (mensuales ?? []).map((m) => ({
    etiqueta: fmtMes(String(m.mes)),
    envios: Number(m.envios ?? 0),
    entregados: Number(m.entregados ?? 0),
    facturado: Number(m.facturado ?? 0),
    comisiones: Number(m.comisiones ?? 0),
    gastos: Number(m.gastos ?? 0),
    ganancia: Number(m.ganancia ?? 0),
  }))

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Etiqueta>DASHBOARD</Etiqueta>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Ganancia y operación</h1>
        </div>
        <RegistrarGasto />
      </header>

      {errDiarias ? (
        <Tarjeta>
          <p className="text-sm text-[var(--orange)]">No pudimos cargar las métricas. Recargá la página.</p>
        </Tarjeta>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <ResumenGanancia titulo="HOY" datos={hoy} />
            <ResumenGanancia titulo="ESTA SEMANA" datos={estaSemana} />
            <ResumenGanancia titulo="ESTE MES" datos={esteMes} />
          </div>

          <Tarjeta>
            <DashboardPeriodo dia={dias} semana={semanas} mes={meses} />
          </Tarjeta>

          <Tarjeta>
            <Etiqueta>DÍA ESPECÍFICO</Etiqueta>
            <div className="mt-4">
              <DiaEspecifico hoy={(fechaHoy as unknown as string) ?? ''} />
            </div>
          </Tarjeta>

          <section>
            <Etiqueta>QUÉ COMERCIO VENDE MÁS (ÚLTIMOS 30 DÍAS)</Etiqueta>
            <div className="mt-3">
              {!ranking || ranking.length === 0 ? (
                <Tarjeta>
                  <p className="text-sm text-[var(--muted)]">Todavía no hay envíos de comercios en este período.</p>
                </Tarjeta>
              ) : (
                <Tarjeta>
                  <BarrasRanking datos={ranking.map((r) => ({ etiqueta: String(r.nombre ?? ''), valor: Number(r.facturado ?? 0) }))} formatValor={formatMonto} />
                </Tarjeta>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  )
}

function ResumenGanancia({ titulo, datos }: { titulo: string; datos?: { ganancia: number; envios: number } }) {
  return (
    <Tarjeta className="p-4 text-center">
      <p className={`text-2xl font-bold tabular-nums sm:text-3xl ${(datos?.ganancia ?? 0) >= 0 ? 'text-primary' : 'text-[var(--orange)]'}`}>
        {formatMonto(Number(datos?.ganancia ?? 0))}
      </p>
      <p className="mt-1 text-[10px] tracking-[.16em] text-[var(--muted)]">GANANCIA · {titulo}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{Number(datos?.envios ?? 0)} envíos</p>
    </Tarjeta>
  )
}
