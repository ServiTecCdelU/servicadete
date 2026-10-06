'use client'

import { useActionState, useState } from 'react'
import { Aviso, Boton, Campo, inputClass, Tarjeta } from '@/components/app/ui'
import { pedirCadete, type PedirCadeteState } from './actions'

export function PedirCadete() {
  const [abierto, setAbierto] = useState(false)
  const [ok, setOk] = useState(false)
  const [state, formAction, pending] = useActionState<PedirCadeteState, FormData>(
    async (prev, formData) => {
      const resultado = await pedirCadete(prev, formData)
      if (resultado.estado === 'ok') {
        setAbierto(false)
        setOk(true)
        setTimeout(() => setOk(false), 4000)
      }
      return resultado
    },
    { estado: 'inicial' },
  )

  if (!abierto) {
    return (
      <div className="grid gap-3">
        {ok && <Aviso tono="ok">¡Listo! Ya avisamos a los cadetes.</Aviso>}
        <Boton onClick={() => setAbierto(true)} className="h-16 w-full text-lg">
          Pedir cadete
        </Boton>
      </div>
    )
  }

  return (
    <Tarjeta className="border-primary/40">
      <form action={formAction} className="grid gap-4">
        <Campo label="Destino">
          <input name="direccionDestino" required maxLength={160} autoFocus className={`${inputClass} h-14 text-lg`} />
        </Campo>
        <Campo label="Nota (opcional)">
          <input name="nota" maxLength={300} className={inputClass} />
        </Campo>

        {state.estado === 'error' && <Aviso tono="error">{state.mensaje}</Aviso>}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={() => setAbierto(false)} className="h-14">
            Cancelar
          </Boton>
          <Boton disabled={pending} className="h-14 flex-1 text-lg sm:flex-none">
            {pending ? 'Pidiendo…' : 'Confirmar pedido'}
          </Boton>
        </div>
      </form>
    </Tarjeta>
  )
}
