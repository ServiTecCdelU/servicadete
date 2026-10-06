'use client'

import { useActionState, useState } from 'react'
import { Aviso, Boton, Campo, Etiqueta, inputClass, Tarjeta } from '@/components/app/ui'
import { crearEnvioAdmin, type NuevoEnvioState } from './envios-actions'

interface Opcion { id: string; nombre: string }
interface Comercio extends Opcion { tarifa: number }

export function NuevoEnvio({
  comercios,
  cadetes,
  comisionDefault,
}: {
  comercios: Comercio[]
  cadetes: Opcion[]
  comisionDefault: number
}) {
  const [abierto, setAbierto] = useState(false)
  const [comercioId, setComercioId] = useState('')
  const [state, formAction, pending] = useActionState<NuevoEnvioState, FormData>(
    async (prev, formData) => {
      const resultado = await crearEnvioAdmin(prev, formData)
      if (resultado.estado === 'ok') {
        setAbierto(false)
        setComercioId('')
      }
      return resultado
    },
    { estado: 'inicial' },
  )

  const comercio = comercios.find((c) => c.id === comercioId)

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
          <select name="comercioId" value={comercioId} onChange={(e) => setComercioId(e.target.value)} className={inputClass}>
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

        {comercio ? (
          <div className="sm:col-span-2">
            <Campo label="Comisión a cobrar del cadete" hint={`Tarifa del comercio: ${comercio.tarifa.toLocaleString('es-AR')} · no puede superarla`}>
              <input
                key={comercio.id}
                name="comision"
                type="number"
                inputMode="decimal"
                min="0"
                max={comercio.tarifa}
                step="1"
                defaultValue={Math.min(comisionDefault, comercio.tarifa)}
                required
                className={inputClass}
              />
            </Campo>
          </div>
        ) : (
          <input type="hidden" name="comision" value="0" />
        )}

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
