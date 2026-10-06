import { formatMonto } from '@/lib/format'

export function ResumenCadete({ debeRendir, ganadoSemana }: { debeRendir: number; ganadoSemana: number }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="rounded-xl border border-[var(--orange)]/30 bg-[var(--orange)]/5 p-4 text-center">
        <p className="text-2xl font-bold tabular-nums text-[var(--orange)]">{formatMonto(debeRendir)}</p>
        <p className="mt-1 text-[10px] tracking-[.14em] text-[var(--muted)]">DEBÉS RENDIR</p>
      </div>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
        <p className="text-2xl font-bold tabular-nums text-primary">{formatMonto(ganadoSemana)}</p>
        <p className="mt-1 text-[10px] tracking-[.14em] text-[var(--muted)]">GANASTE ESTA SEMANA</p>
      </div>
    </div>
  )
}
