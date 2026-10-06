import { formatMonto } from '@/lib/format'

export function ResumenCadete({ debeRendir, ganadoSemana }: { debeRendir: number; ganadoSemana: number }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3">
      <div className="min-w-0 rounded-xl border border-[var(--orange)]/30 bg-[var(--orange)]/5 p-3 text-center sm:p-4">
        <p className="truncate text-lg font-bold tabular-nums text-[var(--orange)] sm:text-2xl">{formatMonto(debeRendir)}</p>
        <p className="mt-1 text-[9px] tracking-[.12em] text-[var(--muted)] sm:text-[10px] sm:tracking-[.14em]">SALDO PENDIENTE</p>
      </div>
      <div className="min-w-0 rounded-xl border border-primary/30 bg-primary/5 p-3 text-center sm:p-4">
        <p className="truncate text-lg font-bold tabular-nums text-primary sm:text-2xl">{formatMonto(ganadoSemana)}</p>
        <p className="mt-1 text-[9px] tracking-[.12em] text-[var(--muted)] sm:text-[10px] sm:tracking-[.14em]">GANASTE ESTA SEMANA</p>
      </div>
    </div>
  )
}
