'use client'

import { useActionState, useState } from 'react'
import { Boton, inputClass } from '@/components/app/ui'
import { cambiarPasswordAdmin, type CambiarPasswordState } from './actions'

export function CambiarPasswordAdmin({ mensajeriaId }: { mensajeriaId: string }) {
  const [abierto, setAbierto] = useState(false)
  const [state, formAction, pending] = useActionState<CambiarPasswordState, FormData>(cambiarPasswordAdmin, {
    estado: 'inicial',
  })

  if (state.estado === 'ok') {
    return (
      <div className="w-full basis-full rounded-md border border-primary/40 bg-primary/5 p-3">
        <p className="text-xs text-[var(--muted)]">
          Nueva contraseña de <strong className="text-foreground">{state.email}</strong>.{' '}
          <strong className="text-foreground">No se vuelve a mostrar</strong>.
        </p>
        <p className="mt-2 select-all font-mono text-lg font-bold text-primary">{state.password}</p>
      </div>
    )
  }

  if (!abierto) {
    return (
      <Boton type="button" variante="secundario" onClick={() => setAbierto(true)} className="h-9 px-3 text-xs">
        Cambiar contraseña del admin
      </Boton>
    )
  }

  return (
    <form action={formAction} className="flex w-full basis-full flex-wrap items-center gap-2">
      <input type="hidden" name="mensajeriaId" value={mensajeriaId} />
      <input
        name="password"
        type="text"
        placeholder="Dejalo vacío para generar una"
        minLength={8}
        className={`${inputClass} h-9 w-64 text-sm`}
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
