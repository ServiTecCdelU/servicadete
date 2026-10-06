'use client'

import Script from 'next/script'
import { useEffect, useId, useRef, useState } from 'react'
import { withBasePath } from '@/lib/base-path'
import { createClient } from '@/lib/supabase/client'

// Google Identity Services: el botón corre 100% en nuestro dominio, así que el
// selector de cuentas de Google muestra servitec.net.ar y no el dominio de Supabase
// (eso pasa con signInWithOAuth, que redirige primero a *.supabase.co/auth/v1/authorize).
declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void
        }
      }
    }
  }
}

interface BotonGoogleProps {
  onError: (mensaje: string) => void
}

export function BotonGoogle({ onError }: BotonGoogleProps) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const contenedorId = useId()
  const contenedorRef = useRef<HTMLDivElement>(null)
  const [scriptListo, setScriptListo] = useState(false)

  useEffect(() => {
    if (!clientId || !scriptListo || !window.google) return

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: async ({ credential }) => {
        const { error } = await createClient().auth.signInWithIdToken({ provider: 'google', token: credential })
        if (error) onError('No pudimos completar el ingreso con Google. Probá de nuevo.')
        else window.location.reload()
      },
    })
    if (contenedorRef.current) {
      window.google.accounts.id.renderButton(contenedorRef.current, {
        type: 'standard',
        theme: 'filled_black',
        size: 'large',
        width: 320,
        text: 'continue_with',
        locale: 'es',
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId, scriptListo])

  // Sin Client ID de Google configurado: fallback al OAuth redirect normal de Supabase
  // (ese sí muestra de paso el dominio de *.supabase.co en el selector de cuentas).
  if (!clientId) return <BotonGoogleOAuth onError={onError} />

  return (
    <div>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={() => setScriptListo(true)} />
      {!scriptListo && <div className="h-12 w-full animate-pulse rounded-md bg-[var(--panel-2)]" aria-hidden />}
      <div id={contenedorId} ref={contenedorRef} className="flex justify-center" />
    </div>
  )
}

function BotonGoogleOAuth({ onError }: BotonGoogleProps) {
  const [pending, setPending] = useState(false)

  async function entrar() {
    setPending(true)
    const { error } = await createClient().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${withBasePath('/auth/callback')}` },
    })
    if (error) {
      onError('No pudimos abrir Google. Probá de nuevo.')
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={entrar}
      disabled={pending}
      className="flex h-12 w-full items-center justify-center gap-3 rounded-md bg-white font-semibold text-[#111] transition hover:bg-white/90 disabled:opacity-60"
    >
      {pending ? 'Abriendo Google…' : 'Continuar con Google'}
    </button>
  )
}
