'use client'

import { useActionState, useState } from 'react'
import { Aviso, Boton, inputClass } from '@/components/app/ui'
import { cambiarMiEmail, cambiarMiPassword, type MiEmailState, type MiPasswordState } from './actions'

export function MiCuenta({ emailActual }: { emailActual: string }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <CambiarEmail emailActual={emailActual} />
      <CambiarPassword />
    </div>
  )
}

function CambiarEmail({ emailActual }: { emailActual: string }) {
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState<MiEmailState, FormData>(cambiarMiEmail, { estado: 'inicial' })
  const emailMostrado = state.estado === 'ok' ? state.email : emailActual

  return (
    <div>
      <p className="text-xs tracking-[.14em] text-[var(--muted)]">EMAIL ACTUAL</p>
      <p className="mt-1 select-all text-base">{emailMostrado}</p>
      {state.estado === 'ok' && <p className="mt-1 text-xs text-primary">Listo. La próxima vez entrá con este email.</p>}

      {!abierto ? (
        <Boton type="button" variante="secundario" onClick={() => setAbierto(true)} className="mt-3 h-9 px-3 text-xs">
          Cambiar email
        </Boton>
      ) : (
        <form action={formAction} className="mt-3 flex flex-wrap items-center gap-2">
          <input name="email" type="email" required placeholder="nuevo@email.com" className={`${inputClass} h-9 w-56 text-sm`} />
          {state.estado === 'error' && <span className="text-xs text-[var(--orange)]">{state.mensaje}</span>}
          <Boton disabled={pending} className="h-9 px-3 text-xs">{pending ? 'Guardando…' : 'Confirmar'}</Boton>
          <Boton type="button" variante="secundario" onClick={() => setAbierto(false)} className="h-9 px-3 text-xs">Cancelar</Boton>
        </form>
      )}
    </div>
  )
}

function CambiarPassword() {
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState<MiPasswordState, FormData>(
    async (prev, formData) => {
      const resultado = await cambiarMiPassword(prev, formData)
      if (resultado.estado === 'ok') setAbierto(false)
      return resultado
    },
    { estado: 'inicial' },
  )

  return (
    <div>
      <p className="text-xs tracking-[.14em] text-[var(--muted)]">CONTRASEÑA</p>
      <p className="mt-1 text-sm text-[var(--muted)]">Por seguridad, no se muestra la actual.</p>

      {!abierto ? (
        <Boton type="button" variante="secundario" onClick={() => setAbierto(true)} className="mt-3 h-9 px-3 text-xs">
          Cambiar contraseña
        </Boton>
      ) : (
        <form action={formAction} className="mt-3 flex flex-wrap items-center gap-2">
          <input name="password" type="text" required minLength={8} placeholder="Nueva contraseña" className={`${inputClass} h-9 w-56 text-sm`} />
          {state.estado === 'error' && <span className="text-xs text-[var(--orange)]">{state.mensaje}</span>}
          <Boton disabled={pending} className="h-9 px-3 text-xs">{pending ? 'Guardando…' : 'Confirmar'}</Boton>
          <Boton type="button" variante="secundario" onClick={() => setAbierto(false)} className="h-9 px-3 text-xs">Cancelar</Boton>
        </form>
      )}
    </div>
  )
}
