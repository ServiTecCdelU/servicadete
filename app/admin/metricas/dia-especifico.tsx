'use client'

import { useActionState } from 'react'
import { Boton, Tarjeta, inputClass } from '@/components/app/ui'
import { formatMonto } from '@/lib/format'
import { consultarDia, type DiaEspecificoState } from './actions'

export function DiaEspecifico({ hoy }: { hoy: string }) {
  const [state, formAction, pending] = useActionState<DiaEspecificoState, FormData>(consultarDia, { estado: 'inicial' })

  return (
    <div className="grid gap-3">
      <form action={formAction} className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs text-[var(--muted)]">
          Día específico
          <input name="fecha" type="date" defaultValue={hoy} max={hoy} className={`${inputClass} h-10`} />
        </label>
        <Boton disabled={pending} className="h-10 px-4 text-sm">{pending ? 'Buscando…' : 'Consultar'}</Boton>
      </form>

      {state.estado === 'error' && <p className="text-sm text-[var(--orange)]">{state.mensaje}</p>}

      {state.estado === 'ok' && (
        <Tarjeta className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Envíos" valor={String(state.envios)} />
          <Stat label="Entregados" valor={String(state.entregados)} />
          <Stat label="Facturado" valor={formatMonto(state.facturado)} />
          <Stat
            label="Ganancia"
            valor={formatMonto(state.ganancia)}
            tono={state.ganancia >= 0 ? 'ok' : 'alerta'}
          />
        </Tarjeta>
      )}
    </div>
  )
}

function Stat({ label, valor, tono }: { label: string; valor: string; tono?: 'ok' | 'alerta' }) {
  return (
    <div className="text-center">
      <p
        className={`text-xl font-bold tabular-nums ${tono === 'ok' ? 'text-primary' : tono === 'alerta' ? 'text-[var(--orange)]' : ''}`}
      >
        {valor}
      </p>
      <p className="mt-1 text-[10px] tracking-[.14em] text-[var(--muted)]">{label.toUpperCase()}</p>
    </div>
  )
}
