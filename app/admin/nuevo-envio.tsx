'use client'

import { useActionState, useState } from 'react'
import { Aviso, Boton, Campo, Etiqueta, inputClass, Tarjeta } from '@/components/app/ui'
import { crearEnvioAdmin, type NuevoEnvioState } from './envios-actions'

interface Opcion { id: string; nombre: string }

export function NuevoEnvio({ comercios, cadetes }: { comercios: Opcion[]; cadetes: Opcion[] }) {
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState<NuevoEnvioState, FormData>(
    async (prev, formData) => {
      const resultado = await crearEnvioAdmin(prev, formData)
      if (resultado.estado === 'ok') setAbierto(false)
      return resultado
    },
    { estado: 'inicial' },
  )

  if (!abierto) {
    return (
      <Boton onClick={() => setAbierto(true)} className="w-full sm:w-auto">
        + Nuevo envío
      </Boton>
    )
  }

  return (
    <Tarjeta className="border-primary/40">
      <Etiqueta>NUEVO ENVÍO</Etiqueta>
      <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo label="Comercio (opcional)">
          <select name="comercioId" className={inputClass}>
            <option value="">Particular / sin comercio</option>
            {comercios.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </Campo>
        <Campo label="Cadete (opcional)">
          <select name="cadeteId" className={inputClass}>
            <option value="">Sin asignar</option>
            {cadetes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </Campo>
        <div className="sm:col-span-2">
          <Campo label="Destino">
            <input name="direccionDestino" required maxLength={160} className={inputClass} />
          </Campo>
        </div>
        <div className="sm:col-span-2">
          <Campo label="Nota (opcional)">
            <input name="nota" maxLength={300} className={inputClass} />
          </Campo>
        </div>

        {state.estado === 'error' && (
          <div className="sm:col-span-2">
            <Aviso tono="error">{state.mensaje}</Aviso>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>
            Cancelar
          </Boton>
          <Boton disabled={pending}>{pending ? 'Creando…' : 'Crear envío'}</Boton>
        </div>
      </form>
    </Tarjeta>
  )
}
