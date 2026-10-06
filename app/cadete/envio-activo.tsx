'use client'

import { useActionState, useState, useTransition } from 'react'
import { Boton } from '@/components/app/ui'
import { obtenerUbicacion } from '@/lib/geolocation'
import { marcarEntregado, marcarRetirado, type AccionState } from './actions'

export interface EnvioActivoRow {
  id: string
  estado: string
  direccion_destino: string
  tarifa: number
  comision: number
  nota: string | null
  comercios: { nombre: string; direccion: string | null } | null
}

export function EnvioActivo({ envio }: { envio: EnvioActivoRow }) {
  const [state, setState] = useState<AccionState>({ error: null })
  const [pending, startTransition] = useTransition()

  function enviar(accion: typeof marcarRetirado) {
    startTransition(async () => {
      const { lat, lng } = await obtenerUbicacion()
      const fd = new FormData()
      fd.set('id', envio.id)
      if (lat !== undefined) fd.set('lat', String(lat))
      if (lng !== undefined) fd.set('lng', String(lng))
      setState(await accion(state, fd))
    })
  }

  return (
    <div className="rounded-xl border border-primary/40 bg-primary/5 p-5">
      <p className="text-[10px] font-extrabold tracking-[.2em] text-primary">ENVÍO ACTIVO</p>
      <h3 className="mt-2 text-xl font-bold tracking-tight">{envio.comercios?.nombre ?? 'Sin comercio'}</h3>
      {envio.comercios?.direccion && <p className="text-sm text-[var(--muted)]">Retirar en: {envio.comercios.direccion}</p>}
      <p className="mt-2 text-base">{envio.direccion_destino}</p>
      {envio.nota && <p className="mt-1 text-sm text-[var(--muted)]">Nota: {envio.nota}</p>}
      <p className="mt-2 text-sm">Ganás <strong className="text-primary">{(envio.tarifa - envio.comision).toLocaleString('es-AR')}</strong> con este envío.</p>

      {state.error && <p role="alert" className="mt-2 text-sm text-[var(--orange)]">{state.error}</p>}

      <div className="mt-4">
        {envio.estado === 'asignado' ? (
          <Boton disabled={pending} onClick={() => enviar(marcarRetirado)} className="h-14 w-full text-lg">
            {pending ? 'Guardando…' : 'Retiré'}
          </Boton>
        ) : (
          <Boton disabled={pending} onClick={() => enviar(marcarEntregado)} className="h-14 w-full text-lg">
            {pending ? 'Guardando…' : 'Entregué'}
          </Boton>
        )}
      </div>
    </div>
  )
}
