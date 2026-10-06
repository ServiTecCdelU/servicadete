'use client'

import { useActionState, useState } from 'react'
import { Aviso, Boton, Campo, inputClass, Tarjeta } from '@/components/app/ui'
import { registrarGasto, type GastoState } from './actions'

export function RegistrarGasto() {
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState<GastoState, FormData>(
    async (prev, formData) => {
      const resultado = await registrarGasto(prev, formData)
      if (resultado.estado === 'ok') setAbierto(false)
      return resultado
    },
    { estado: 'inicial' },
  )

  if (!abierto) {
    return (
      <Boton variante="secundario" onClick={() => setAbierto(true)} className="w-full sm:w-auto">
        + Registrar gasto
      </Boton>
    )
  }

  return (
    <Tarjeta>
      <form action={formAction} className="grid gap-4 sm:grid-cols-3">
        <Campo label="Concepto">
          <input name="concepto" required maxLength={120} placeholder="Nafta, repuesto, etc." autoFocus className={inputClass} />
        </Campo>
        <Campo label="Monto">
          <input name="monto" type="number" inputMode="decimal" min="0" step="1" required className={inputClass} />
        </Campo>
        <Campo label="Nota (opcional)">
          <input name="nota" maxLength={200} className={inputClass} />
        </Campo>

        {state.estado === 'error' && (
          <div className="sm:col-span-3">
            <Aviso tono="error">{state.mensaje}</Aviso>
          </div>
        )}

        <div className="flex gap-3 sm:col-span-3">
          <Boton disabled={pending}>{pending ? 'Guardando…' : 'Registrar gasto'}</Boton>
          <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>Cancelar</Boton>
        </div>
      </form>
    </Tarjeta>
  )
}
