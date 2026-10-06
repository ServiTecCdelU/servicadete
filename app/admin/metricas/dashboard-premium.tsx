'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import {
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  PackageCheck,
  ReceiptText,
  TrendingUp,
} from 'lucide-react'
import { formatMonto } from '@/lib/format'

export interface FilaMetrica {
  etiqueta: string
  envios: number
  entregados: number
  facturado: number
  comisiones: number
  gastos: number
  ganancia: number
}

interface RankingItem {
  nombre: string
  envios: number
  entregados: number
  facturado: number
}

interface DashboardPremiumProps {
  dia: FilaMetrica[]
  semana: FilaMetrica[]
  mes: FilaMetrica[]
  ranking: RankingItem[]
}

const PERIODOS = [
  { key: 'dia', label: 'Días', hint: 'últimos 14' },
  { key: 'semana', label: 'Semanas', hint: 'últimas 8' },
  { key: 'mes', label: 'Meses', hint: 'últimos 6' },
] as const

type PeriodoKey = (typeof PERIODOS)[number]['key']

type ChartMode = 'dinero' | 'envios'

export function DashboardPremium({ dia, semana, mes, ranking }: DashboardPremiumProps) {
  const [periodo, setPeriodo] = useState<PeriodoKey>('dia')
  const [chartMode, setChartMode] = useState<ChartMode>('dinero')
  const datasets: Record<PeriodoKey, FilaMetrica[]> = { dia, semana, mes }
  const filas = [...datasets[periodo]].reverse()
  const total = sumar(filas)
  const ultimo = filas[filas.length - 1]
  const anterior = filas.length > 1 ? filas[filas.length - 2] : undefined
  const ticket = total.entregados > 0 ? total.facturado / total.entregados : 0
  const tasaEntrega = total.envios > 0 ? (total.entregados / total.envios) * 100 : 0
  const variacionGanancia = ultimo && anterior && anterior.ganancia !== 0
    ? ((ultimo.ganancia - anterior.ganancia) / Math.abs(anterior.ganancia)) * 100
    : null

  return (
    <div className="grid gap-5 sm:gap-6">
      <div className="grid gap-4 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-[var(--muted)]">
            <span className="size-2 rounded-full bg-primary shadow-[0_0_12px_rgba(183,243,75,.65)]" />
            Centro de control
          </div>
          <h2 className="text-2xl font-bold tracking-[-.04em] sm:text-3xl">La operación, de un vistazo.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
            Facturación, costos, entregas y ganancia en una sola vista. Cambiá el período para detectar tendencias sin perderte en números.
          </p>
        </div>

        <div className="grid grid-cols-3 rounded-2xl border border-border bg-[var(--panel-2)] p-1">
          {PERIODOS.map((p) => (
            <button
              key={p.key}
              type="button"
              onClick={() => setPeriodo(p.key)}
              className={`min-w-20 rounded-xl px-3 py-2 text-left transition sm:min-w-24 ${
                periodo === p.key
                  ? 'bg-primary text-primary-foreground shadow-[0_5px_20px_rgba(183,243,75,.12)]'
                  : 'text-[var(--muted)] hover:bg-white/[.03] hover:text-foreground'
              }`}
            >
              <span className="block text-xs font-bold">{p.label}</span>
              <span className={`mt-0.5 block text-[9px] ${periodo === p.key ? 'opacity-70' : 'opacity-60'}`}>{p.hint}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          icon={<CircleDollarSign size={18} />}
          label="Ganancia neta"
          value={formatMonto(total.ganancia)}
          tone={total.ganancia >= 0 ? 'positive' : 'negative'}
          detail={variacionGanancia === null ? 'resultado del período' : `${formatPercent(variacionGanancia)} vs período anterior`}
          trend={variacionGanancia === null ? undefined : variacionGanancia >= 0 ? 'up' : 'down'}
        />
        <KpiCard
          icon={<ReceiptText size={18} />}
          label="Facturado"
          value={formatMonto(total.facturado)}
          detail={`${total.entregados.toLocaleString('es-AR')} entregados`}
        />
        <KpiCard
          icon={<PackageCheck size={18} />}
          label="Envíos"
          value={total.envios.toLocaleString('es-AR')}
          detail={`${tasaEntrega.toFixed(1)}% de entrega`}
          tone={tasaEntrega >= 90 ? 'positive' : tasaEntrega >= 70 ? 'neutral' : 'negative'}
        />
        <KpiCard
          icon={<TrendingUp size={18} />}
          label="Ticket promedio"
          value={formatMonto(ticket)}
          detail="por envío entregado"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.75fr)_minmax(280px,.75fr)]">
        <section className="overflow-hidden rounded-2xl border border-border bg-[var(--panel)] shadow-[0_18px_55px_rgba(0,0,0,.18)]">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
            <div>
              <p className="text-sm font-bold">Evolución</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Compará lo que entra, lo que cuesta y lo que queda.</p>
            </div>
            <div className="flex rounded-lg border border-border bg-[var(--panel-2)] p-1">
              <button onClick={() => setChartMode('dinero')} className={switchClass(chartMode === 'dinero')} type="button">Pesos</button>
              <button onClick={() => setChartMode('envios')} className={switchClass(chartMode === 'envios')} type="button">Envíos</button>
            </div>
          </div>
          <div className="p-3 sm:p-5">
            <TrendChart filas={filas} mode={chartMode} />
          </div>
        </section>

        <section className="rounded-2xl border border-border bg-[var(--panel)] p-4 shadow-[0_18px_55px_rgba(0,0,0,.18)] sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold">Salud de la operación</p>
              <p className="mt-1 text-xs text-[var(--muted)]">Qué porcentaje de los envíos termina entregado.</p>
            </div>
            <CheckCircle2 className="text-primary" size={20} />
          </div>
          <DeliveryRing percent={tasaEntrega} />
          <div className="grid grid-cols-2 gap-2">
            <MiniMetric label="Entregados" value={total.entregados} />
            <MiniMetric label="No entregados" value={Math.max(0, total.envios - total.entregados)} />
            <MiniMetric label="Cadetes" value={total.comisiones} money />
            <MiniMetric label="Gastos" value={total.gastos} money />
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-2xl border border-border bg-[var(--panel)] shadow-[0_18px_55px_rgba(0,0,0,.18)]">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-4 py-4 sm:px-5">
          <div>
            <p className="text-sm font-bold">Detalle del período</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Ganancia = facturado − cadetes − gastos.</p>
          </div>
          <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-[10px] font-semibold text-primary">
            {filas.length} {periodo === 'dia' ? 'días' : periodo === 'semana' ? 'semanas' : 'meses'}
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="bg-[var(--panel-2)] text-left text-[9px] uppercase tracking-[.15em] text-[var(--muted)]">
                <th className="px-4 py-3 font-semibold sm:px-5">Período</th>
                <th className="px-3 py-3 text-right font-semibold">Envíos</th>
                <th className="px-3 py-3 text-right font-semibold">Entregados</th>
                <th className="px-3 py-3 text-right font-semibold">Facturado</th>
                <th className="px-3 py-3 text-right font-semibold">Costos</th>
                <th className="px-4 py-3 text-right font-semibold sm:px-5">Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((f, i) => {
                const costos = f.comisiones + f.gastos
                return (
                  <tr key={`${f.etiqueta}-${i}`} className="border-t border-border/70 transition hover:bg-white/[.025]">
                    <td className="px-4 py-3 font-medium sm:px-5">{f.etiqueta}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{f.envios}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[var(--muted)]">{f.entregados}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatMonto(f.facturado)}</td>
                    <td className="px-3 py-3 text-right tabular-nums text-[var(--muted)]">{formatMonto(costos)}</td>
                    <td className={`px-4 py-3 text-right font-bold tabular-nums sm:px-5 ${f.ganancia >= 0 ? 'text-primary' : 'text-[var(--orange)]'}`}>
                      {formatMonto(f.ganancia)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-[var(--panel)] p-4 shadow-[0_18px_55px_rgba(0,0,0,.18)] sm:p-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-bold">Comercios que más facturan</p>
            <p className="mt-1 text-xs text-[var(--muted)]">Últimos 30 días · ordenado por facturación confirmada.</p>
          </div>
          {ranking.length > 0 && <span className="text-[10px] text-[var(--muted)]">{ranking.length} comercios</span>}
        </div>
        <div className="mt-5 grid gap-3">
          {ranking.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-[var(--muted)]">
              Todavía no hay envíos de comercios en este período.
            </div>
          ) : (
            ranking.slice(0, 8).map((item, index) => (
              <RankingRow key={`${item.nombre}-${index}`} item={item} index={index} max={ranking[0]?.facturado ?? 1} />
            ))
          )}
        </div>
      </section>
    </div>
  )
}

function KpiCard({ icon, label, value, detail, tone = 'neutral', trend }: {
  icon: ReactNode
  label: string
  value: string
  detail: string
  tone?: 'positive' | 'negative' | 'neutral'
  trend?: 'up' | 'down'
}) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-[var(--panel)] p-4 shadow-[0_15px_40px_rgba(0,0,0,.14)] transition hover:-translate-y-0.5 hover:border-primary/25 sm:p-5">
      <div className="absolute -right-8 -top-8 size-24 rounded-full bg-primary/[.04] blur-2xl transition group-hover:bg-primary/[.08]" />
      <div className="relative flex items-start justify-between gap-3">
        <span className={`grid size-9 place-items-center rounded-xl border ${tone === 'negative' ? 'border-[var(--orange)]/20 bg-[var(--orange)]/10 text-[var(--orange)]' : 'border-primary/15 bg-primary/8 text-primary'}`}>
          {icon}
        </span>
        {trend === 'up' && <ArrowUpRight size={16} className="text-primary" />}
        {trend === 'down' && <ArrowDownRight size={16} className="text-[var(--orange)]" />}
      </div>
      <p className="relative mt-5 text-[10px] font-bold uppercase tracking-[.16em] text-[var(--muted)]">{label}</p>
      <p className={`relative mt-1 truncate text-2xl font-bold tracking-[-.04em] tabular-nums sm:text-[28px] ${tone === 'negative' ? 'text-[var(--orange)]' : ''}`}>{value}</p>
      <p className="relative mt-1 text-[11px] text-[var(--muted)]">{detail}</p>
    </div>
  )
}

function TrendChart({ filas, mode }: { filas: FilaMetrica[]; mode: ChartMode }) {
  const width = 900
  const height = 310
  const pad = { top: 18, right: 16, bottom: 44, left: 54 }
  const innerW = width - pad.left - pad.right
  const innerH = height - pad.top - pad.bottom
  const values = mode === 'dinero'
    ? filas.flatMap((f) => [f.facturado, f.ganancia])
    : filas.flatMap((f) => [f.envios, f.entregados])
  const min = mode === 'dinero' ? Math.min(0, ...values) : 0
  const max = Math.max(1, ...values)
  const range = Math.max(1, max - min)
  const count = Math.max(1, filas.length)
  const x = (i: number) => pad.left + (count === 1 ? innerW / 2 : (i / (count - 1)) * innerW)
  const y = (v: number) => pad.top + innerH - ((v - min) / range) * innerH
  const zeroY = y(0)
  const facturadoPoints = filas.map((f, i) => `${x(i)},${y(mode === 'dinero' ? f.facturado : f.envios)}`).join(' ')
  const secondaryPoints = filas.map((f, i) => `${x(i)},${y(mode === 'dinero' ? Math.max(0, f.ganancia) : f.entregados)}`).join(' ')
  const labels = chooseLabels(filas)
  const grid = [0, .25, .5, .75, 1]

  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-4 text-[10px] font-semibold text-[var(--muted)]">
        <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-primary" />{mode === 'dinero' ? 'Facturado' : 'Envíos'}</span>
        <span className="flex items-center gap-2"><i className="size-2 rounded-full bg-[var(--cyan)]" />{mode === 'dinero' ? 'Ganancia' : 'Entregados'}</span>
      </div>
      <div className="overflow-hidden rounded-xl bg-[var(--panel-2)]/55">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-auto w-full" role="img" aria-label="Evolución de métricas">
          <defs>
            <linearGradient id="areaLime" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#b7f34b" stopOpacity=".22" />
              <stop offset="100%" stopColor="#b7f34b" stopOpacity="0" />
            </linearGradient>
          </defs>
          {grid.map((ratio) => {
            const yy = pad.top + innerH - ratio * innerH
            const isZero = mode === 'dinero' && Math.abs(min + range * ratio) < Math.max(1, range * 0.01)
            return <line key={ratio} x1={pad.left} x2={width - pad.right} y1={yy} y2={yy} stroke={isZero ? 'rgba(183,243,75,.22)' : 'rgba(164,184,210,.10)'} strokeWidth={isZero ? '1.5' : '1'} />
          })}
          {grid.map((ratio) => {
            const value = min + range * ratio
            const yy = pad.top + innerH - ratio * innerH
            return <text key={`t-${ratio}`} x="8" y={yy + 3} fill="#6f7e94" fontSize="10">{formatAxis(value, mode)}</text>
          })}
          {filas.length > 1 && (
            <polygon
              points={`${pad.left},${zeroY} ${facturadoPoints} ${width - pad.right},${zeroY}`}
              fill="url(#areaLime)"
            />
          )}
          <polyline points={facturadoPoints} fill="none" stroke="#b7f34b" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points={secondaryPoints} fill="none" stroke="#36d3c7" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="6 6" />
          {filas.map((f, i) => (
            <g key={`${f.etiqueta}-${i}`}>
              <circle cx={x(i)} cy={y(mode === 'dinero' ? f.facturado : f.envios)} r="4" fill="#b7f34b" />
              <circle cx={x(i)} cy={y(mode === 'dinero' ? Math.max(0, f.ganancia) : f.entregados)} r="3.5" fill="#36d3c7" />
              {labels.includes(i) && <text x={x(i)} y={height - 15} textAnchor="middle" fill="#75849a" fontSize="10">{f.etiqueta}</text>}
            </g>
          ))}
        </svg>
      </div>
      <div className="mt-3 flex items-center justify-between text-[10px] text-[var(--muted)]">
        <span>{filas[0]?.etiqueta ?? '—'}</span>
        <span>→ más reciente</span>
      </div>
    </div>
  )
}

function DeliveryRing({ percent }: { percent: number }) {
  const safe = Math.min(100, Math.max(0, percent))
  const radius = 52
  const circumference = 2 * Math.PI * radius
  const dash = (safe / 100) * circumference
  return (
    <div className="flex justify-center py-4">
      <div className="relative size-44">
        <svg viewBox="0 0 140 140" className="size-full -rotate-90">
          <circle cx="70" cy="70" r={radius} fill="none" stroke="rgba(164,184,210,.10)" strokeWidth="12" />
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#b7f34b" strokeWidth="12" strokeLinecap="round" strokeDasharray={`${dash} ${circumference - dash}`} />
        </svg>
        <div className="absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="text-3xl font-bold tracking-[-.05em]">{safe.toFixed(1)}%</p>
            <p className="mt-1 text-[9px] font-bold uppercase tracking-[.18em] text-[var(--muted)]">entrega</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function RankingRow({ item, index, max }: { item: RankingItem; index: number; max: number }) {
  const width = Math.max(3, (item.facturado / Math.max(1, max)) * 100)
  return (
    <div className="grid grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-transparent px-2 py-2 transition hover:border-border hover:bg-white/[.02] sm:grid-cols-[34px_minmax(0,1fr)_150px_auto]">
      <span className={`grid size-7 place-items-center rounded-lg text-[10px] font-bold ${index === 0 ? 'bg-primary text-primary-foreground' : 'bg-[var(--panel-2)] text-[var(--muted)]'}`}>{String(index + 1).padStart(2, '0')}</span>
      <div className="min-w-0">
        <div className="flex items-center justify-between gap-3">
          <p className="truncate text-sm font-semibold">{item.nombre}</p>
          <span className="shrink-0 text-[10px] text-[var(--muted)] sm:hidden">{formatMonto(item.facturado)}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--panel-2)]">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${width}%` }} />
        </div>
      </div>
      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold tabular-nums">{formatMonto(item.facturado)}</p>
        <p className="mt-0.5 text-[10px] text-[var(--muted)]">{item.entregados}/{item.envios} entregados</p>
      </div>
      <span className="hidden rounded-full border border-border px-2 py-1 text-[9px] text-[var(--muted)] sm:block">{item.envios} envíos</span>
    </div>
  )
}

function MiniMetric({ label, value, money }: { label: string; value: number; money?: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-[var(--panel-2)] px-3 py-2.5">
      <p className="text-[9px] uppercase tracking-[.12em] text-[var(--muted)]">{label}</p>
      <p className="mt-1 text-sm font-bold tabular-nums">{money ? formatMonto(value) : value.toLocaleString('es-AR')}</p>
    </div>
  )
}

function sumar(filas: FilaMetrica[]) {
  return filas.reduce(
    (acc, f) => ({
      envios: acc.envios + Number(f.envios || 0),
      entregados: acc.entregados + Number(f.entregados || 0),
      facturado: acc.facturado + Number(f.facturado || 0),
      comisiones: acc.comisiones + Number(f.comisiones || 0),
      gastos: acc.gastos + Number(f.gastos || 0),
      ganancia: acc.ganancia + Number(f.ganancia || 0),
    }),
    { envios: 0, entregados: 0, facturado: 0, comisiones: 0, gastos: 0, ganancia: 0 },
  )
}

function chooseLabels(filas: FilaMetrica[]) {
  if (filas.length <= 7) return filas.map((_, i) => i)
  const indexes = new Set<number>([0, filas.length - 1])
  const step = Math.ceil((filas.length - 1) / 5)
  for (let i = step; i < filas.length - 1; i += step) indexes.add(i)
  return [...indexes]
}

function formatAxis(value: number, mode: ChartMode) {
  if (mode === 'envios') return Math.round(value).toLocaleString('es-AR')
  if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `$${Math.round(value / 1000)}k`
  return `$${Math.round(value)}`
}

function formatPercent(value: number) {
  const rounded = Math.abs(value) >= 10 ? Math.round(value) : Number(value.toFixed(1))
  return `${rounded > 0 ? '+' : ''}${rounded}%`
}

function switchClass(active: boolean) {
  return `rounded-md px-2.5 py-1.5 text-[10px] font-semibold transition ${active ? 'bg-primary text-primary-foreground' : 'text-[var(--muted)] hover:text-foreground'}`
}
