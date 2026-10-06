'use client'

import { useActionState, useState } from 'react'
import { Aviso, Boton, Campo, inputClass, Tarjeta } from '@/components/app/ui'
import {
  actualizarComercio,
  actualizarDatosComercio,
  cambiarEstadoComercio,
  cambiarPinComercio,
  generarAccesoComercio,
  type AccesoState,
  type CambiarPinState,
  type EditarComercioState,
} from './actions'

interface Cadete { id: string; nombre: string }

interface FilaComercioProps {
  comercio: {
    id: string
    nombre: string
    direccion: string | null
    telefono: string | null
    tarifa: number
    activo: boolean
    cadeteFijoId: string | null
    tieneAcceso: boolean
  }
  cadetes: Cadete[]
}

export function FilaComercio({ comercio, cadetes }: FilaComercioProps) {
  const [editando, setEditando] = useState(false)

  return (
    <div className="rounded-xl border border-border bg-[var(--panel)] p-5 shadow-[0_18px_50px_rgba(0,0,0,.2)]">
      <div className="flex flex-wrap items-center gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span
              className={`inline-block size-2 rounded-full ${comercio.activo ? 'bg-primary shadow-[0_0_10px_var(--lime)]' : 'bg-[var(--orange)]'}`}
              aria-hidden
            />
            <h2 className="truncate text-lg font-bold tracking-tight">{comercio.nombre}</h2>
          </div>
          {comercio.direccion && <p className="text-sm text-[var(--muted)]">{comercio.direccion}</p>}
        </div>

        <Boton type="button" variante="secundario" onClick={() => setEditando((v) => !v)} className="h-9 px-3 text-xs">
          {editando ? 'Cerrar' : 'Editar'}
        </Boton>
        <form action={cambiarEstadoComercio}>
          <input type="hidden" name="id" value={comercio.id} />
          <input type="hidden" name="activo" value={String(!comercio.activo)} />
          <Boton variante={comercio.activo ? 'peligro' : 'secundario'} className="h-9 px-3 text-xs">
            {comercio.activo ? 'Desactivar' : 'Activar'}
          </Boton>
        </form>
      </div>

      {editando && <EditarDatos comercio={comercio} />}

      <form action={actualizarComercio} className="mt-4 flex flex-wrap items-end gap-3">
        <input type="hidden" name="id" value={comercio.id} />
        <label className="grid gap-1 text-xs text-[var(--muted)]">
          Tarifa
          <input name="tarifa" type="number" inputMode="decimal" min="0" step="1" defaultValue={comercio.tarifa} className={`${inputClass} h-10 w-28`} />
        </label>
        <label className="grid gap-1 text-xs text-[var(--muted)]">
          Cadete fijo
          <select name="cadeteFijoId" defaultValue={comercio.cadeteFijoId ?? ''} className={`${inputClass} h-10`}>
            <option value="">Sin cadete fijo</option>
            {cadetes.map((c) => (
              <option key={c.id} value={c.id}>{c.nombre}</option>
            ))}
          </select>
        </label>
        <Boton className="h-10 px-3 text-xs">Guardar</Boton>
      </form>

      <div className="mt-4 border-t border-border pt-4">
        {comercio.tieneAcceso ? <CambiarPin comercioId={comercio.id} /> : <GenerarAcceso comercioId={comercio.id} nombreSugerido={comercio.nombre} />}
      </div>
    </div>
  )
}

function EditarDatos({ comercio }: { comercio: { id: string; nombre: string; direccion: string | null; telefono: string | null } }) {
  const [state, formAction, pending] = useActionState<EditarComercioState, FormData>(actualizarDatosComercio, { error: null })

  return (
    <form action={formAction} className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-3">
      <input type="hidden" name="id" value={comercio.id} />
      <Campo label="Nombre">
        <input name="nombre" defaultValue={comercio.nombre} required maxLength={80} className={inputClass} />
      </Campo>
      <Campo label="Dirección">
        <input name="direccion" defaultValue={comercio.direccion ?? ''} maxLength={160} className={inputClass} />
      </Campo>
      <Campo label="Teléfono">
        <input name="telefono" defaultValue={comercio.telefono ?? ''} maxLength={30} className={inputClass} />
      </Campo>
      {state.error && (
        <div className="sm:col-span-3">
          <Aviso tono="error">{state.error}</Aviso>
        </div>
      )}
      <div className="sm:col-span-3">
        <Boton disabled={pending} className="h-9 px-3 text-xs">
          {pending ? 'Guardando…' : 'Guardar datos'}
        </Boton>
      </div>
    </form>
  )
}

function CambiarPin({ comercioId }: { comercioId: string }) {
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState<CambiarPinState, FormData>(cambiarPinComercio, { estado: 'inicial' })

  if (state.estado === 'ok') {
    return (
      <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
        <p className="text-xs text-[var(--muted)]">
          Nuevo PIN del comercio. <strong className="text-foreground">No se vuelve a mostrar</strong>.
        </p>
        <p className="mt-2 select-all font-mono text-lg font-bold text-primary">{state.pin}</p>
      </div>
    )
  }

  if (!abierto) {
    return (
      <Boton type="button" variante="secundario" onClick={() => setAbierto(true)} className="h-9 px-3 text-xs">
        Cambiar PIN
      </Boton>
    )
  }

  return (
    <form action={formAction} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="comercioId" value={comercioId} />
      <input name="pin" inputMode="numeric" maxLength={8} placeholder="Dejalo vacío para generar uno" className={`${inputClass} h-9 w-56 text-sm`} />
      {state.estado === 'error' && <span className="text-xs text-[var(--orange)]">{state.mensaje}</span>}
      <Boton disabled={pending} className="h-9 px-3 text-xs">
        {pending ? 'Guardando…' : 'Confirmar'}
      </Boton>
      <Boton type="button" variante="secundario" onClick={() => setAbierto(false)} className="h-9 px-3 text-xs">
        Cancelar
      </Boton>
    </form>
  )
}

function GenerarAcceso({ comercioId, nombreSugerido }: { comercioId: string; nombreSugerido: string }) {
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState<AccesoState, FormData>(generarAccesoComercio, { estado: 'inicial' })

  if (state.estado === 'ok') {
    return (
      <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
        <p className="text-xs text-[var(--muted)]">
          Pasale estos datos al comercio. El PIN <strong className="text-foreground">no se vuelve a mostrar</strong>.
        </p>
        <dl className="mt-2 grid gap-1 font-mono text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
          <dt className="text-[var(--muted)]">Usuario</dt>
          <dd className="select-all break-all">{state.usuario}</dd>
          <dt className="text-[var(--muted)]">PIN</dt>
          <dd className="select-all text-lg font-bold text-primary">{state.pin}</dd>
        </dl>
      </div>
    )
  }

  if (!abierto) {
    return (
      <Boton type="button" variante="secundario" onClick={() => setAbierto(true)} className="h-9 px-3 text-xs">
        Generar acceso
      </Boton>
    )
  }

  return (
    <form action={formAction} className="grid gap-2 sm:grid-cols-2">
      <input type="hidden" name="comercioId" value={comercioId} />
      <input name="nombre" defaultValue={nombreSugerido} required maxLength={80} placeholder="Nombre" className={`${inputClass} h-9 text-sm`} />
      <input name="email" type="email" maxLength={160} placeholder="Email (opcional, para Google)" className={`${inputClass} h-9 text-sm`} />
      {state.estado === 'error' && (
        <span className="text-xs text-[var(--orange)] sm:col-span-2">{state.mensaje}</span>
      )}
      <div className="flex gap-2 sm:col-span-2">
        <Boton disabled={pending} className="h-9 px-3 text-xs">
          {pending ? 'Generando…' : 'Confirmar'}
        </Boton>
        <Boton type="button" variante="secundario" onClick={() => setAbierto(false)} className="h-9 px-3 text-xs">
          Cancelar
        </Boton>
      </div>
    </form>
  )
}
