'use client'

import { useActionState, useState } from 'react'
import { Aviso, Boton, Campo, inputClass, Tarjeta } from '@/components/app/ui'
import { registrarEnvioCadete, type AccionState } from './actions'

interface Opcion { id: string; nombre: string }

export function RegistrarEnvio({ comercios }: { comercios: Opcion[] }) {
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState<AccionState, FormData>(
    async (prev, formData) => {
      const resultado = await registrarEnvioCadete(prev, formData)
      if (!resultado.error) setAbierto(false)
      return resultado
    },
    { error: null },
  )

  if (comercios.length === 0) return null

  if (!abierto) {
    return (
      <Boton type="button" variante="secundario" onClick={() => setAbierto(true)} className="w-full">
        + Registrar envío
      </Boton>
    )
  }

  return (
    <Tarjeta>
      <form action={formAction} className="grid gap-4">
        <Campo label="Comercio">
          <select name="comercioId" required autoFocus className={inputClass}>
            <option value="">Elegí un comercio</option>
            {comercios.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </Campo>
        <Campo label="Destino (opcional)">
          <input name="direccionDestino" maxLength={160} className={inputClass} />
        </Campo>

        {state.error && <Aviso tono="error">{state.error}</Aviso>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>
            Cancelar
          </Boton>
          <Boton disabled={pending}>{pending ? 'Guardando…' : 'Registrar'}</Boton>
        </div>
      </form>
    </Tarjeta>
  )
}
