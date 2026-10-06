'use client'

import { useActionState, useState } from 'react'
import { loginConPassword, type LoginState } from '@/app/auth/actions'
import { createClient } from '@/lib/supabase/client'

const inputClass =
  'h-12 w-full rounded-md border border-border bg-[var(--panel-2)] px-3 text-base outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/25'

export function LoginForm() {
  const [state, formAction, pending] = useActionState<LoginState, FormData>(loginConPassword, { error: null })
  const [googleError, setGoogleError] = useState<string | null>(null)
  const [googlePending, setGooglePending] = useState(false)

  async function entrarConGoogle() {
    setGooglePending(true)
    setGoogleError(null)
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    // Si no hay error, el navegador ya está navegando a Google.
    if (error) {
      setGoogleError('No pudimos abrir Google. Probá de nuevo.')
      setGooglePending(false)
    }
  }

  return (
    <div className="mt-6 grid gap-5">
      <button
        type="button"
        onClick={entrarConGoogle}
        disabled={googlePending}
        className="flex h-12 items-center justify-center gap-3 rounded-md bg-white font-semibold text-[#111] transition hover:bg-white/90 disabled:opacity-60"
      >
        <GoogleIcon />
        {googlePending ? 'Abriendo Google…' : 'Continuar con Google'}
      </button>
      {googleError && <p role="alert" className="text-sm text-[var(--orange)]">{googleError}</p>}

      <div className="flex items-center gap-3 text-xs tracking-[.16em] text-[var(--muted)]">
        <span className="h-px flex-1 bg-border" /> O CON EMAIL <span className="h-px flex-1 bg-border" />
      </div>

      <form action={formAction} className="grid gap-3">
        <label className="grid gap-1.5 text-sm">
          Email
          <input name="email" type="email" autoComplete="username" required className={inputClass} />
        </label>
        <label className="grid gap-1.5 text-sm">
          Contraseña
          <input name="password" type="password" autoComplete="current-password" required minLength={6} className={inputClass} />
        </label>
        {state.error && <p role="alert" className="text-sm text-[var(--orange)]">{state.error}</p>}
        <button
          disabled={pending}
          className="mt-1 h-12 rounded-md bg-primary font-extrabold text-primary-foreground shadow-[0_0_28px_rgba(183,243,75,.14)] transition hover:shadow-[0_0_34px_rgba(183,243,75,.3)] disabled:opacity-60"
        >
          {pending ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}
