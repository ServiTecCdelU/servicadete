'use client'

import { useActionState } from 'react'
import { crearPedidoPublico, type PedidoPublicoState } from './actions'

const inputClass =
  'h-12 w-full rounded-md border border-border bg-[var(--panel-2)] px-3 text-base outline-none transition placeholder:text-[var(--muted)]/60 focus:border-primary focus:ring-2 focus:ring-primary/25'

export function PedidoForm({ slug }: { slug: string }) {
  const [state, formAction, pending] = useActionState<PedidoPublicoState, FormData>(crearPedidoPublico, { error: null })

  return (
    <form action={formAction} className="grid gap-3">
      <input type="hidden" name="slug" value={slug} />
      {/* Honeypot anti-spam: oculto para una persona, visible para un bot que completa todo. */}
      <div className="absolute -left-[9999px]" aria-hidden="true">
        <label>
          No completar
          <input name="web" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <label className="grid gap-1.5 text-sm">
        Tu nombre
        <input name="nombre" required maxLength={80} className={inputClass} />
      </label>
      <label className="grid gap-1.5 text-sm">
        Teléfono
        <input name="telefono" type="tel" required maxLength={30} placeholder="341 555-0000" className={inputClass} />
      </label>
      <label className="grid gap-1.5 text-sm">
        Dirección de retiro
        <input name="direccionOrigen" required maxLength={160} className={inputClass} />
      </label>
      <label className="grid gap-1.5 text-sm">
        Dirección de envío
        <input name="direccionDestino" required maxLength={160} className={inputClass} />
      </label>
      <label className="grid gap-1.5 text-sm">
        Nota (opcional)
        <input name="nota" maxLength={300} className={inputClass} />
      </label>

      {state.error && (
        <p role="alert" className="rounded-md border border-[var(--orange)]/40 bg-[var(--orange)]/10 p-3 text-sm text-[var(--orange)]">
          {state.error}
        </p>
      )}

      <button
        disabled={pending}
        className="mt-1 h-13 rounded-md bg-primary py-3.5 font-extrabold text-primary-foreground shadow-[0_0_28px_rgba(183,243,75,.14)] transition hover:shadow-[0_0_34px_rgba(183,243,75,.3)] disabled:opacity-60"
      >
        {pending ? 'Enviando…' : 'Pedir envío'}
      </button>
    </form>
  )
}
