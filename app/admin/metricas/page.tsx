import { Etiqueta, Tarjeta } from '@/components/app/ui'
import { formatMonto } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { DashboardPeriodo } from './dashboard-periodo'
import { DiaEspecifico } from './dia-especifico'
import { RegistrarGasto } from './registrar-gasto'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const fmtFecha = (iso: string) => { const [, m, d] = iso.split('-'); return `${d}/${m}` }
const fmtMes = (iso: string) => MESES[Number(iso.split('-')[1]) - 1]

export default async function MetricasPage() {
  const supabase = await createClient()

  const [{ data: diarias, error: errDiarias }, { data: semanales }, { data: mensuales }, { data: ranking }, { data: fechaHoy }] =
    await Promise.all([
      supabase.rpc('metricas_diarias', { p_dias: 14 }),
      supabase.rpc('metricas_semanales', { p_semanas: 8 }),
      supabase.rpc('metricas_mensuales', { p_meses: 6 }),
      supabase.rpc('ranking_comercios', { p_dias: 30 }),
      supabase.rpc('fecha_operativa'),
    ])

  const hoy = diarias?.[0]
  const estaSemana = semanales?.[0]
  const esteMes = mensuales?.[0]

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
            <DashboardPeriodo
              dia={(diarias ?? []).map((d) => ({ etiqueta: fmtFecha(d.fecha), envios: d.envios, entregados: d.entregados, facturado: d.facturado, comisiones: d.comisiones, gastos: d.gastos, ganancia: d.ganancia }))}
              semana={(semanales ?? []).map((s) => ({ etiqueta: `${fmtFecha(s.semana_inicio)}–${fmtFecha(s.semana_fin)}`, envios: s.envios, entregados: s.entregados, facturado: s.facturado, comisiones: s.comisiones, gastos: s.gastos, ganancia: s.ganancia }))}
              mes={(mensuales ?? []).map((m) => ({ etiqueta: fmtMes(m.mes), envios: m.envios, entregados: m.entregados, facturado: m.facturado, comisiones: m.comisiones, gastos: m.gastos, ganancia: m.ganancia }))}
            />
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
                  <div className="grid gap-2.5">
                    {ranking.map((r, i) => {
                      const valor = Number(r.facturado ?? 0)
                      const max = Math.max(1, ...ranking.map((item) => Number(item.facturado ?? 0)))
                      return (
                        <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
                          <div className="min-w-0">
                            <p className="truncate">{r.nombre}</p>
                            <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-[var(--panel-2)]">
                              <div
                                className="h-full rounded-full"
                                style={{ width: `${Math.max(2, (valor / max) * 100)}%`, background: '#8a9c1e' }}
                              />
                            </div>
                          </div>
                          <span className="whitespace-nowrap text-right tabular-nums text-[var(--muted)]">{formatMonto(valor)}</span>
                        </div>
                      )
                    })}
                  </div>
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
        {formatMonto(datos?.ganancia ?? 0)}
      </p>
      <p className="mt-1 text-[10px] tracking-[.16em] text-[var(--muted)]">GANANCIA · {titulo}</p>
      <p className="mt-1 text-xs text-[var(--muted)]">{datos?.envios ?? 0} envíos</p>
    </Tarjeta>
  )
}
