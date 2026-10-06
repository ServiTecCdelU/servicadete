'use client'

import { useActionState, useState } from 'react'
import { Aviso, Boton, Campo, Etiqueta, inputClass, Tarjeta } from '@/components/app/ui'
import { crearCadete, type NuevoCadeteState } from './actions'

export function NuevoCadete() {
  const [abierto, setAbierto] = useState(false)

  const [state, formAction, pending] = useActionState<NuevoCadeteState, FormData>(
    async (prev, formData) => {
      const resultado = await crearCadete(prev, formData)
      if (resultado.estado === 'ok') setAbierto(false)
      return resultado
    },
    { estado: 'inicial' },
  )
  const errores = state.estado === 'error' ? (state.errores ?? {}) : {}

  if (!abierto) {
    return (
      <div className="grid gap-3">
        {state.estado === 'ok' && <Credenciales {...state} />}
        <Boton onClick={() => setAbierto(true)} className="w-full sm:w-auto sm:justify-self-start">
          + Nuevo cadete
        </Boton>
      </div>
    )
  }

  return (
    <Tarjeta>
      <Etiqueta>NUEVO CADETE</Etiqueta>
      <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre" error={errores.nombre}>
          <input name="nombre" required maxLength={80} aria-invalid={Boolean(errores.nombre)} className={inputClass} />
        </Campo>
        <Campo label="Teléfono (opcional)" error={errores.telefono}>
          <input name="telefono" maxLength={30} className={inputClass} />
        </Campo>
        <Campo label="DNI (opcional)" error={errores.dni}>
          <input name="dni" maxLength={9} inputMode="numeric" className={inputClass} />
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
          <Boton disabled={pending}>{pending ? 'Creando…' : 'Crear cadete'}</Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

function Credenciales({ nombre, usuario, pin }: { nombre: string; usuario: string; pin: string }) {
  return (
    <Tarjeta className="border-primary/40">
      <Etiqueta>LISTO · {nombre.toUpperCase()}</Etiqueta>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Pasale estos datos al cadete para que entre desde su celular. El PIN{' '}
        <strong className="text-foreground">no se vuelve a mostrar</strong>.
      </p>
      <dl className="mt-4 grid gap-2 font-mono text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <dt className="text-[var(--muted)]">Usuario</dt>
        <dd className="select-all break-all">{usuario}</dd>
        <dt className="text-[var(--muted)]">PIN</dt>
        <dd className="select-all text-lg font-bold text-primary">{pin}</dd>
      </dl>
    </Tarjeta>
  )
}
