'use client'

import { useActionState, useState } from 'react'
import { Aviso, Boton, Campo, Etiqueta, inputClass, Tarjeta } from '@/components/app/ui'
import { crearComercio, type NuevoComercioState } from './actions'

export function NuevoComercio() {
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState<NuevoComercioState, FormData>(
    async (prev, formData) => {
      const resultado = await crearComercio(prev, formData)
      if (resultado.estado === 'ok') setAbierto(false)
      return resultado
    },
    { estado: 'inicial' },
  )
  const errores = state.estado === 'error' ? (state.errores ?? {}) : {}

  if (!abierto) {
    return (
      <Boton onClick={() => setAbierto(true)} className="w-full sm:w-auto sm:justify-self-start">
        + Nuevo comercio
      </Boton>
    )
  }

  return (
    <Tarjeta>
      <Etiqueta>NUEVO COMERCIO</Etiqueta>
      <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre" error={errores.nombre}>
          <input name="nombre" required maxLength={80} aria-invalid={Boolean(errores.nombre)} className={inputClass} />
        </Campo>
        <Campo label="Tarifa por envío" error={errores.tarifa}>
          <input name="tarifa" type="number" inputMode="decimal" min="0" step="1" defaultValue={0} required className={inputClass} />
        </Campo>
        <Campo label="Dirección (opcional)" error={errores.direccion}>
          <input name="direccion" maxLength={160} className={inputClass} />
        </Campo>
        <Campo label="Teléfono (opcional)" error={errores.telefono}>
          <input name="telefono" maxLength={30} className={inputClass} />
        </Campo>

        {state.estado === 'error' && state.mensaje && (
          <div className="sm:col-span-2">
            <Aviso tono="error">{state.mensaje}</Aviso>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>
            Cancelar
          </Boton>
          <Boton disabled={pending}>{pending ? 'Creando…' : 'Crear comercio'}</Boton>
        </div>
      </form>
    </Tarjeta>
  )
}
