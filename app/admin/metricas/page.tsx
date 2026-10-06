import { Etiqueta, Tarjeta } from '@/components/app/ui'
import { createClient } from '@/lib/supabase/server'
import { DashboardPremium, type FilaMetrica } from './dashboard-premium'
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

  const dia: FilaMetrica[] = (diarias ?? []).map((d) => ({
    etiqueta: fmtFecha(d.fecha),
    envios: Number(d.envios ?? 0),
    entregados: Number(d.entregados ?? 0),
    facturado: Number(d.facturado ?? 0),
    comisiones: Number(d.comisiones ?? 0),
    gastos: Number(d.gastos ?? 0),
    ganancia: Number(d.ganancia ?? 0),
  }))

  const semana: FilaMetrica[] = (semanales ?? []).map((s) => ({
    etiqueta: `${fmtFecha(s.semana_inicio)}–${fmtFecha(s.semana_fin)}`,
    envios: Number(s.envios ?? 0),
    entregados: Number(s.entregados ?? 0),
    facturado: Number(s.facturado ?? 0),
    comisiones: Number(s.comisiones ?? 0),
    gastos: Number(s.gastos ?? 0),
    ganancia: Number(s.ganancia ?? 0),
  }))

  const mes: FilaMetrica[] = (mensuales ?? []).map((m) => ({
    etiqueta: fmtMes(m.mes),
    envios: Number(m.envios ?? 0),
    entregados: Number(m.entregados ?? 0),
    facturado: Number(m.facturado ?? 0),
    comisiones: Number(m.comisiones ?? 0),
    gastos: Number(m.gastos ?? 0),
    ganancia: Number(m.ganancia ?? 0),
  }))

  return (
    <div className="grid gap-7 pb-10 sm:gap-8">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <Etiqueta>DASHBOARD · ADMIN</Etiqueta>
          <h1 className="mt-2 text-3xl font-bold tracking-[-.05em] sm:text-4xl">Ganancia y operación</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Todo lo importante para saber cómo está funcionando la mensajería.</p>
        </div>
        <RegistrarGasto />
      </header>

      {errDiarias ? (
        <Tarjeta>
          <p className="text-sm text-[var(--orange)]">No pudimos cargar las métricas. Recargá la página.</p>
        </Tarjeta>
      ) : (
        <>
          <DashboardPremium
            dia={dia}
            semana={semana}
            mes={mes}
            ranking={(ranking ?? []).map((r) => ({
              nombre: r.nombre,
              envios: Number(r.envios ?? 0),
              entregados: Number(r.entregados ?? 0),
              facturado: Number(r.facturado ?? 0),
            }))}
          />

          <Tarjeta className="overflow-hidden p-4 sm:p-5">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <Etiqueta>DÍA ESPECÍFICO</Etiqueta>
                <p className="mt-1 text-sm text-[var(--muted)]">Consultá cualquier fecha operativa y revisá su resultado.</p>
              </div>
            </div>
            <div className="mt-4">
              <DiaEspecifico hoy={(fechaHoy as unknown as string) ?? ''} />
            </div>
          </Tarjeta>
        </>
      )}
    </div>
  )
}
