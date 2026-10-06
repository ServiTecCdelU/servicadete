'use client'

import { useActionState, useState } from 'react'
import { Boton, inputClass } from '@/components/app/ui'
import { registrarRendicion, type RendicionState } from './actions'

export function RendicionForm({ cadeteId }: { cadeteId: string }) {
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState<RendicionState, FormData>(
    async (prev, formData) => {
      const resultado = await registrarRendicion(prev, formData)
      if (!resultado.error) setAbierto(false)
      return resultado
    },
    { error: null },
  )

  if (!abierto) {
    return (
      <Boton type="button" variante="secundario" onClick={() => setAbierto(true)} className="h-9 px-3 text-xs">
        Registrar rendición
      </Boton>
    )
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="cadeteId" value={cadeteId} />
      <input
        name="monto"
        type="number"
        inputMode="decimal"
        min="1"
        step="1"
        required
        placeholder="Monto"
        autoFocus
        className={`${inputClass} h-9 w-28 text-sm`}
      />
      {state.error && <span className="text-xs text-[var(--orange)]">{state.error}</span>}
      <Boton disabled={pending} className="h-9 px-3 text-xs">
        {pending ? 'Guardando…' : 'Confirmar'}
      </Boton>
      <Boton type="button" variante="secundario" onClick={() => setAbierto(false)} className="h-9 px-3 text-xs">
        Cancelar
      </Boton>
    </form>
  )
}
