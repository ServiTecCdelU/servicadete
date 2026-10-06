'use client'

import { useActionState, useState } from 'react'
import { Aviso, Boton, Campo, inputClass, Tarjeta } from '@/components/app/ui'
import {
  actualizarCadete,
  cambiarEmailCadete,
  cambiarPinCadete,
  type CambiarEmailState,
  type CambiarPinState,
  type EditarCadeteState,
} from './actions'

interface EditarCadeteProps {
  cadete: { id: string; nombre: string; telefono: string | null; dni: string | null; email: string | null }
}

export function EditarCadete({ cadete }: EditarCadeteProps) {
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState<EditarCadeteState, FormData>(
    async (prev, formData) => {
      const resultado = await actualizarCadete(prev, formData)
      if (!resultado.error) setAbierto(false)
      return resultado
    },
    { error: null },
  )

  if (!abierto) {
    return (
      <Boton type="button" variante="secundario" onClick={() => setAbierto(true)} className="h-9 px-3 text-xs">
        Editar
      </Boton>
    )
  }

  return (
    <Tarjeta className="mt-3 w-full basis-full">
      <form action={formAction} className="grid gap-4 sm:grid-cols-3">
        <input type="hidden" name="id" value={cadete.id} />
        <Campo label="Nombre">
          <input name="nombre" defaultValue={cadete.nombre} required maxLength={80} className={inputClass} />
        </Campo>
        <Campo label="Teléfono">
          <input name="telefono" defaultValue={cadete.telefono ?? ''} maxLength={30} className={inputClass} />
        </Campo>
        <Campo label="DNI">
          <input name="dni" defaultValue={cadete.dni ?? ''} maxLength={9} inputMode="numeric" className={inputClass} />
        </Campo>

        {state.error && (
          <div className="sm:col-span-3">
            <Aviso tono="error">{state.error}</Aviso>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:col-span-3 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>
            Cancelar
          </Boton>
          <Boton disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Boton>
        </div>
      </form>

      <div className="mt-4 grid gap-4 border-t border-border pt-4 sm:grid-cols-2">
        <CambiarEmail cadeteId={cadete.id} emailActual={cadete.email} />
        <CambiarPin cadeteId={cadete.id} />
      </div>
    </Tarjeta>
  )
}

function CambiarEmail({ cadeteId, emailActual }: { cadeteId: string; emailActual: string | null }) {
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState<CambiarEmailState, FormData>(cambiarEmailCadete, { estado: 'inicial' })
  const emailMostrado = state.estado === 'ok' ? state.email : emailActual

  return (
    <div>
      <p className="text-xs text-[var(--muted)]">
        Login actual: <span className="select-all text-foreground">{emailMostrado ?? 'sin usuario'}</span>
      </p>
      {state.estado === 'ok' && (
        <p className="mt-1 text-xs text-primary">Listo. Ahora entra con este email (y PIN, o con Google).</p>
      )}

      {!abierto ? (
        <Boton type="button" variante="secundario" onClick={() => setAbierto(true)} className="mt-2 h-9 px-3 text-xs">
          Cargar / cambiar email
        </Boton>
      ) : (
        <form action={formAction} className="mt-2 flex flex-wrap items-center gap-2">
          <input type="hidden" name="cadeteId" value={cadeteId} />
          <input
            name="email"
            type="email"
            placeholder="email@gmail.com"
            required
            className={`${inputClass} h-9 w-56 text-sm`}
          />
          {state.estado === 'error' && <span className="text-xs text-[var(--orange)]">{state.mensaje}</span>}
          <Boton disabled={pending} className="h-9 px-3 text-xs">
            {pending ? 'Guardando…' : 'Confirmar'}
          </Boton>
          <Boton type="button" variante="secundario" onClick={() => setAbierto(false)} className="h-9 px-3 text-xs">
            Cancelar
          </Boton>
        </form>
      )}
    </div>
  )
}

function CambiarPin({ cadeteId }: { cadeteId: string }) {
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState<CambiarPinState, FormData>(cambiarPinCadete, { estado: 'inicial' })

  if (state.estado === 'ok') {
    return (
      <div className="rounded-md border border-primary/40 bg-primary/5 p-3">
        <p className="text-xs text-[var(--muted)]">
          Nuevo PIN del cadete. <strong className="text-foreground">No se vuelve a mostrar</strong>.
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
      <input type="hidden" name="cadeteId" value={cadeteId} />
      <input
        name="pin"
        inputMode="numeric"
        maxLength={8}
        placeholder="Dejalo vacío para generar uno"
        className={`${inputClass} h-9 w-56 text-sm`}
      />
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
