'use client'

import { Boton, inputClass } from '@/components/app/ui'
import { formatHora, formatMonto } from '@/lib/format'
import { asignarCadete, cancelarEnvio, confirmarEnvio, rechazarEnvio } from './envios-actions'

const ESTADO_LABEL: Record<string, string> = {
  solicitado: 'Solicitado',
  asignado: 'Asignado',
  retirado: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export interface EnvioRow {
  id: string
  estado: string
  direccion_destino: string
  tarifa: number
  comision: number
  confirmado: boolean
  origen: string
  created_at: string
  cadetes: { nombre: string } | null
  comercios: { nombre: string } | null
}

export function EnvioCard({ envio, cadetes }: { envio: EnvioRow; cadetes: { id: string; nombre: string }[] }) {
  const sinConfirmar = !envio.confirmado && envio.estado !== 'cancelado'

  return (
    <div
      className={`rounded-lg border p-4 ${sinConfirmar ? 'border-[var(--orange)]/40 bg-[var(--orange)]/5' : 'border-border bg-[var(--panel)]'}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-bold">
            {ESTADO_LABEL[envio.estado] ?? envio.estado}
            {sinConfirmar && (
              <span className="rounded border border-[var(--orange)]/50 px-1.5 py-0.5 text-[10px] font-bold tracking-widest text-[var(--orange)]">
                SIN CONFIRMAR
              </span>
            )}
          </p>
          <p className="mt-1 truncate text-base">{envio.direccion_destino}</p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            {envio.comercios?.nombre ?? (envio.origen === 'particular' ? 'Pedido particular' : 'Sin comercio')}
            {envio.cadetes?.nombre && ` · ${envio.cadetes.nombre}`}
            {' · '}
            {formatHora(envio.created_at)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums">{formatMonto(envio.tarifa)}</p>
          {envio.comision > 0 && (
            <p className="text-[10px] text-[var(--muted)]">comisión {formatMonto(envio.comision)}</p>
          )}
        </div>
      </div>

      {sinConfirmar && (
        <div className="mt-3 flex flex-wrap gap-2">
          <form action={confirmarEnvio}>
            <input type="hidden" name="id" value={envio.id} />
            <Boton className="h-9 px-3 text-xs">Confirmar</Boton>
          </form>
          <form action={rechazarEnvio}>
            <input type="hidden" name="id" value={envio.id} />
            <Boton variante="peligro" className="h-9 px-3 text-xs">Rechazar</Boton>
          </form>
        </div>
      )}

      {envio.estado === 'solicitado' && !envio.cadetes && !sinConfirmar && cadetes.length > 0 && (
        <form action={asignarCadete} className="mt-3 flex flex-wrap items-center gap-2">
          <input type="hidden" name="id" value={envio.id} />
          <select name="cadeteId" required className={`${inputClass} h-9 w-auto text-xs`}>
            <option value="">Asignar a…</option>
            {cadetes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
          <Boton className="h-9 px-3 text-xs">Asignar</Boton>
        </form>
      )}

      {envio.estado !== 'entregado' && envio.estado !== 'cancelado' && !sinConfirmar && (
        <form action={cancelarEnvio} className="mt-3">
          <input type="hidden" name="id" value={envio.id} />
          <Boton variante="secundario" className="h-9 px-3 text-xs">Cancelar envío</Boton>
        </form>
      )}
    </div>
  )
}
