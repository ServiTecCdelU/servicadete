'use client'

import { useActionState, useState } from 'react'
import { loginConPassword, type LoginState } from '@/app/auth/actions'
import { BotonGoogle } from './boton-google'

const inputClass =
  'h-12 w-full rounded-md border border-border bg-[var(--panel-2)] px-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25'

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginConPassword, { error: null })
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [mostrarPassword, setMostrarPassword] = useState(false)

  return (
    <div className="mt-6 grid gap-5">
      <BotonGoogle onError={setGoogleError} />
      {googleError && <p role="alert" className="text-sm text-[var(--orange)]">{googleError}</p>}

      {!mostrarPassword ? (
        <button
          type="button"
          onClick={() => setMostrarPassword(true)}
          className="text-center text-sm text-[var(--cyan)] underline-offset-4 hover:underline"
        >
          Ya tengo usuario y contraseña
        </button>
      ) : (
        <>
          <div className="flex items-center gap-3 text-xs tracking-[.16em] text-[var(--muted)]">
            <span className="h-px flex-1 bg-border" /> USUARIO Y CONTRASEÑA <span className="h-px flex-1 bg-border" />
          </div>

          <form action={formAction} className="grid gap-3">
            <label className="grid gap-1.5 text-sm">
              Email o usuario
              <input name="identificador" autoComplete="username" required autoFocus className={inputClass} />
            </label>
            <label className="grid gap-1.5 text-sm">
              Contraseña o PIN
              <input name="password" type="password" autoComplete="current-password" required minLength={4} className={inputClass} />
            </label>
            {state.error && <p role="alert" className="text-sm text-[var(--orange)]">{state.error}</p>}
            <button
              disabled={pending}
              className="mt-1 h-12 rounded-md bg-primary font-extrabold text-primary-foreground shadow-[0_0_28px_rgba(183,243,75,.14)] transition hover:shadow-[0_0_34px_rgba(183,243,75,.3)] disabled:opacity-60"
            >
              {pending ? 'Ingresando…' : 'Ingresar'}
            </button>
          </form>
        </>
      )}
    </div>
  )
}
