'use client'

import { useState } from 'react'
import { BarrasAgrupadas, BarrasDivergentes, COLOR_FACTURADO, COLOR_GASTOS, COLOR_PAGADO_CADETES } from '@/components/app/charts'
import { formatMonto } from '@/lib/format'

interface FilaMetrica {
  etiqueta: string
  envios: number
  entregados: number
  facturado: number
  comisiones: number
  gastos: number
  ganancia: number
}

const PERIODOS = [
  { key: 'dia', label: 'Por día' },
  { key: 'semana', label: 'Por semana' },
  { key: 'mes', label: 'Por mes' },
] as const

type PeriodoKey = (typeof PERIODOS)[number]['key']

export function DashboardPeriodo({ dia, semana, mes }: Record<PeriodoKey, FilaMetrica[]>) {
  const [periodo, setPeriodo] = useState<PeriodoKey>('dia')
  const datasets: Record<PeriodoKey, FilaMetrica[]> = { dia, semana, mes }
  // El dashboard muestra lo más reciente primero a la derecha (las RPCs devuelven desc).
  const filas = [...datasets[periodo]].reverse()

  const seriesCostos = [
    { key: 'facturado', label: 'Facturado', color: COLOR_FACTURADO },
    { key: 'comisiones', label: 'Pagado a cadetes', color: COLOR_PAGADO_CADETES },
    { key: 'gastos', label: 'Gastos', color: COLOR_GASTOS },
  ]

  return (
    <div className="grid gap-5">
      <div className="flex gap-1 rounded-lg border border-border p-1">
        {PERIODOS.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriodo(p.key)}
            className={`flex-1 rounded-md py-2 text-sm font-semibold transition ${
              periodo === p.key ? 'bg-primary text-primary-foreground' : 'text-[var(--muted)] hover:text-foreground'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-3 text-xs tracking-[.14em] text-[var(--muted)]">FACTURADO, PAGADO A CADETES Y GASTOS</p>
        <BarrasAgrupadas
          series={seriesCostos}
          datos={filas.map((f) => ({
            etiqueta: f.etiqueta,
            valores: { facturado: f.facturado, comisiones: f.comisiones, gastos: f.gastos },
          }))}
          formatValor={formatMonto}
        />
      </div>

      <div>
        <p className="mb-3 text-xs tracking-[.14em] text-[var(--muted)]">GANANCIA NETA</p>
        <BarrasDivergentes datos={filas.map((f) => ({ etiqueta: f.etiqueta, valor: f.ganancia }))} formatValor={formatMonto} />
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-[var(--cyan)]">Ver como tabla</summary>
        <div className="mt-3 overflow-x-auto rounded-xl border border-border">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-[var(--panel)] text-left text-[10px] tracking-[.14em] text-[var(--muted)]">
                <th className="px-4 py-3 font-medium">PERÍODO</th>
                <th className="px-4 py-3 text-right font-medium">ENVÍOS</th>
                <th className="px-4 py-3 text-right font-medium">ENTREGADOS</th>
                <th className="px-4 py-3 text-right font-medium">FACTURADO</th>
                <th className="px-4 py-3 text-right font-medium">PAGADO A CADETES</th>
                <th className="px-4 py-3 text-right font-medium">GASTOS</th>
                <th className="px-4 py-3 text-right font-medium">GANANCIA</th>
              </tr>
            </thead>
            <tbody>
              {datasets[periodo].map((f, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{f.etiqueta}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{f.envios}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{f.entregados}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMonto(f.facturado)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMonto(f.comisiones)}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{formatMonto(f.gastos)}</td>
                  <td className="px-4 py-3 text-right font-bold tabular-nums">{formatMonto(f.ganancia)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  )
}
