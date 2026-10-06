'use client'

// Gráficos simples en CSS/HTML (sin librería): barras agrupadas, barras divergentes
// (ganancia +/-) y un ranking horizontal. Paleta validada con el script de dataviz
// contra el fondo oscuro de la app (#060a18): ver supabase/migrations — categórica
// [facturado, pagado a cadetes, gastos] = [#8a9c1e, #2a7fae, #d9703f].
import { useState } from 'react'

export const COLOR_FACTURADO = '#8a9c1e'
export const COLOR_PAGADO_CADETES = '#2a7fae'
export const COLOR_GASTOS = '#d9703f'

interface Serie {
  key: string
  label: string
  color: string
}

interface Punto {
  etiqueta: string
  valores: Record<string, number>
}

interface BarrasAgrupadasProps {
  series: Serie[]
  datos: Punto[]
  formatValor: (n: number) => string
}

export function BarrasAgrupadas({ series, datos, formatValor }: BarrasAgrupadasProps) {
  const max = Math.max(1, ...datos.flatMap((d) => series.map((s) => d.valores[s.key] ?? 0)))
  const [hover, setHover] = useState<{ i: number; k: string } | null>(null)

  return (
    <div>
      {series.length > 1 && (
        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-[var(--muted)]">
          {series.map((s) => (
            <span key={s.key} className="flex items-center gap-1.5">
              <span className="inline-block size-2.5 rounded-full" style={{ background: s.color }} aria-hidden />
              {s.label}
            </span>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2 overflow-x-auto border-b border-[var(--line)] pb-0">
        {datos.map((d, i) => (
          <div key={i} className="flex min-w-[40px] flex-1 flex-col items-center gap-1.5">
            <div className="flex h-40 w-full items-end justify-center gap-0.5">
              {series.map((s) => {
                const v = d.valores[s.key] ?? 0
                const h = v <= 0 ? 0 : Math.max(2, (v / max) * 100)
                const activo = hover?.i === i && hover.k === s.key
                return (
                  <div
                    key={s.key}
                    className="group relative h-full flex-1 max-w-[20px]"
                    onMouseEnter={() => setHover({ i, k: s.key })}
                    onMouseLeave={() => setHover(null)}
                  >
                    <div className="absolute inset-x-0 bottom-0 flex h-full items-end">
                      <div
                        className="w-full rounded-t-[4px] transition-[height]"
                        style={{ height: `${h}%`, background: s.color }}
                      />
                    </div>
                    {activo && (
                      <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-[var(--panel-2)] px-2 py-1 text-[10px] shadow-lg">
                        {s.label}: {formatValor(v)}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <span className="whitespace-nowrap text-[9px] text-[var(--muted)]">{d.etiqueta}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

interface BarrasDivergentesProps {
  datos: { etiqueta: string; valor: number }[]
  formatValor: (n: number) => string
}

// Ganancia +/-: un hue a cada lado del cero (nunca una paleta categórica acá).
export function BarrasDivergentes({ datos, formatValor }: BarrasDivergentesProps) {
  const max = Math.max(1, ...datos.map((d) => Math.abs(d.valor)))
  const [hover, setHover] = useState<number | null>(null)

  return (
    <div className="flex items-stretch gap-2 overflow-x-auto">
      {datos.map((d, i) => {
        const h = Math.max(2, (Math.abs(d.valor) / max) * 50)
        const positivo = d.valor >= 0
        return (
          <div key={i} className="flex min-w-[40px] flex-1 flex-col items-center">
            <div className="relative flex h-32 w-full flex-col justify-center">
              <div className="absolute inset-x-0 top-1/2 h-px bg-[var(--line)]" />
              <div
                className="relative mx-auto w-full max-w-[20px] cursor-default"
                style={{ height: '100%' }}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className={`absolute left-0 right-0 mx-auto w-full ${positivo ? 'rounded-t-[4px] bottom-1/2' : 'rounded-b-[4px] top-1/2'}`}
                  style={{ height: `${h}%`, background: positivo ? 'var(--lime)' : 'var(--orange)' }}
                />
                {hover === i && (
                  <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded border border-border bg-[var(--panel-2)] px-2 py-1 text-[10px] shadow-lg">
                    {formatValor(d.valor)}
                  </div>
                )}
              </div>
            </div>
            <span className="mt-1.5 whitespace-nowrap text-[9px] text-[var(--muted)]">{d.etiqueta}</span>
          </div>
        )
      })}
    </div>
  )
}

interface BarrasRankingProps {
  datos: { etiqueta: string; valor: number }[]
  formatValor: (n: number) => string
  color?: string
}

// Ranking: una sola magnitud por entidad, un solo hue (no hace falta rampa secuencial).
export function BarrasRanking({ datos, formatValor, color = COLOR_FACTURADO }: BarrasRankingProps) {
  const max = Math.max(1, ...datos.map((d) => d.valor))
  return (
    <div className="grid gap-2.5">
      {datos.map((d, i) => (
        <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 text-sm">
          <div className="min-w-0">
            <p className="truncate">{d.etiqueta}</p>
            <div className="mt-1 h-3 w-full overflow-hidden rounded-full bg-[var(--panel-2)]">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(2, (d.valor / max) * 100)}%`, background: color }}
              />
            </div>
          </div>
          <span className="whitespace-nowrap text-right tabular-nums text-[var(--muted)]">{formatValor(d.valor)}</span>
        </div>
      ))}
    </div>
  )
}
