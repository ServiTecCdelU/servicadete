import { Etiqueta, Tarjeta } from '@/components/app/ui'
import { formatMonto } from '@/lib/format'
import { createClient } from '@/lib/supabase/server'
import { RegistrarGasto } from './registrar-gasto'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function fmtFecha(iso: string): string {
  const [, m, d] = iso.split('-')
  return `${d}/${m}`
}

function fmtMes(iso: string): string {
  const [, m] = iso.split('-')
  return MESES[Number(m) - 1]
}

export default async function MetricasPage() {
  const supabase = await createClient()

  const [{ data: diarias, error: errDiarias }, { data: semanales }, { data: mensuales }, { data: ranking }] = await Promise.all([
    supabase.rpc('metricas_diarias', { p_dias: 14 }),
    supabase.rpc('metricas_semanales', { p_semanas: 8 }),
    supabase.rpc('metricas_mensuales', { p_meses: 6 }),
    supabase.rpc('ranking_comercios', { p_dias: 30 }),
  ])

  const hoy = diarias?.[0]
  const estaSemana = semanales?.[0]
  const esteMes = mensuales?.[0]

  return (
    <div className="grid gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Etiqueta>MÉTRICAS Y ANÁLISIS</Etiqueta>
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

          <Tabla
            titulo="POR DÍA (ÚLTIMOS 14)"
            columnas={['Fecha', 'Envíos', 'Entregados', 'Facturado', 'Pagado a cadetes', 'Gastos', 'Ganancia']}
            filas={(diarias ?? []).map((d) => [
              fmtFecha(d.fecha), d.envios, d.entregados, formatMonto(d.facturado), formatMonto(d.comisiones), formatMonto(d.gastos), formatMonto(d.ganancia),
            ])}
          />

          <Tabla
            titulo="POR SEMANA (ÚLTIMAS 8)"
            columnas={['Semana', 'Envíos', 'Entregados', 'Facturado', 'Pagado a cadetes', 'Gastos', 'Ganancia']}
            filas={(semanales ?? []).map((s) => [
              `${fmtFecha(s.semana_inicio)} – ${fmtFecha(s.semana_fin)}`, s.envios, s.entregados, formatMonto(s.facturado), formatMonto(s.comisiones), formatMonto(s.gastos), formatMonto(s.ganancia),
            ])}
          />

          <Tabla
            titulo="POR MES (ÚLTIMOS 6)"
            columnas={['Mes', 'Envíos', 'Entregados', 'Facturado', 'Pagado a cadetes', 'Gastos', 'Ganancia']}
            filas={(mensuales ?? []).map((m) => [
              fmtMes(m.mes), m.envios, m.entregados, formatMonto(m.facturado), formatMonto(m.comisiones), formatMonto(m.gastos), formatMonto(m.ganancia),
            ])}
          />

          <section>
            <Etiqueta>QUÉ COMERCIO VENDE MÁS (ÚLTIMOS 30 DÍAS)</Etiqueta>
            <div className="mt-3">
              {!ranking || ranking.length === 0 ? (
                <Tarjeta>
                  <p className="text-sm text-[var(--muted)]">Todavía no hay envíos de comercios en este período.</p>
                </Tarjeta>
              ) : (
                <Tabla
                  columnas={['Comercio', 'Envíos', 'Entregados', 'Facturado']}
                  filas={ranking.map((r) => [r.nombre, r.envios, r.entregados, formatMonto(r.facturado)])}
                />
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

function Tabla({ titulo, columnas, filas }: { titulo?: string; columnas: string[]; filas: (string | number)[][] }) {
  return (
    <section className="grid gap-3">
      {titulo && <Etiqueta>{titulo}</Etiqueta>}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-border bg-[var(--panel)] text-left text-[10px] tracking-[.14em] text-[var(--muted)]">
              {columnas.map((c, i) => (
                <th key={c} className={`px-4 py-3 font-medium ${i > 0 ? 'text-right' : ''}`}>{c.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {fila.map((valor, j) => (
                  <td key={j} className={`px-4 py-3 ${j > 0 ? 'text-right tabular-nums' : ''}`}>{valor}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
