'use client'

import { useActionState } from 'react'
import { Boton } from '@/components/app/ui'
import { formatMonto } from '@/lib/format'
import { tomarEnvio, type AccionState } from './actions'

export interface EnvioDisponibleRow {
  id: string
  direccion_destino: string
  tarifa: number
  comision: number
  nota: string | null
  comercios: { nombre: string; direccion: string | null } | null
}

export function EnvioDisponible({ envio }: { envio: EnvioDisponibleRow }) {
  const [state, formAction, pending] = useActionState<AccionState, FormData>(tomarEnvio, { error: null })

  return (
    <div className="rounded-lg border border-border bg-[var(--panel)] p-4">
      <h3 className="text-base font-bold">{envio.comercios?.nombre ?? 'Sin comercio'}</h3>
      {envio.comercios?.direccion && <p className="text-sm text-[var(--muted)]">Retirar en: {envio.comercios.direccion}</p>}
      <p className="mt-1 text-sm">{envio.direccion_destino}</p>
      {envio.nota && <p className="mt-1 text-xs text-[var(--muted)]">Nota: {envio.nota}</p>}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="min-w-0 text-sm text-primary">Ganás {formatMonto(envio.tarifa - envio.comision)}</p>
        <form action={formAction}>
          <input type="hidden" name="id" value={envio.id} />
          <Boton disabled={pending} className="h-10 px-4 text-sm">
            {pending ? 'Tomando…' : 'Tomar'}
          </Boton>
        </form>
      </div>
      {state.error && <p role="alert" className="mt-2 text-xs text-[var(--orange)]">{state.error}</p>}
    </div>
  )
}
