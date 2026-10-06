'use client'

import { Boton } from '@/components/app/ui'
import { formatHora, formatMonto } from '@/lib/format'
import { confirmarEnvioCadete, rechazarEnvioCadete } from './actions'

const ESTADO_LABEL: Record<string, string> = {
  solicitado: 'Buscando cadete',
  asignado: 'Cadete en camino a retirar',
  retirado: 'En camino a destino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export interface EnvioComercioRow {
  id: string
  estado: string
  direccion_destino: string
  tarifa: number
  confirmado: boolean
  origen: string
  created_at: string
  cadetes: { nombre: string } | null
}

export function EnvioRow({ envio }: { envio: EnvioComercioRow }) {
  const sinConfirmar = !envio.confirmado && envio.estado !== 'cancelado'

  return (
    <div className={`rounded-lg border p-4 ${sinConfirmar ? 'border-[var(--orange)]/40 bg-[var(--orange)]/5' : 'border-border bg-[var(--panel)]'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
            {ESTADO_LABEL[envio.estado] ?? envio.estado}
            {sinConfirmar && (
              <span className="rounded border border-[var(--orange)]/50 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-[var(--orange)]">
                REGISTRADO POR CADETE
              </span>
            )}
          </p>
          <p className="mt-1 truncate text-base">{envio.direccion_destino}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {envio.cadetes?.nombre ?? 'Sin cadete todavía'} · {formatHora(envio.created_at)}
          </p>
        </div>
        <p className="text-lg font-bold tabular-nums">{formatMonto(envio.tarifa)}</p>
      </div>

      {sinConfirmar && (
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={confirmarEnvioCadete}>
            <input type="hidden" name="id" value={envio.id} />
            <Boton className="h-9 px-3 text-xs">Confirmar</Boton>
          </form>
          <form action={rechazarEnvioCadete}>
            <input type="hidden" name="id" value={envio.id} />
            <Boton variante="peligro" className="h-9 px-3 text-xs">Rechazar</Boton>
          </form>
        </div>
      )}
    </div>
  )
}
