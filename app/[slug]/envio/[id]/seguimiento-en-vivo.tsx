'use client'

import { useEffect, useState } from 'react'
import { formatHora } from '@/lib/format'
import { createClient } from '@/lib/supabase/client'

const PASOS = [
  { estado: 'solicitado', label: 'Solicitado' },
  { estado: 'asignado', label: 'Cadete asignado' },
  { estado: 'retirado', label: 'En camino' },
  { estado: 'entregado', label: 'Entregado' },
] as const

interface EstadoEnvio {
  estado: string
  asignado_at: string | null
  retirado_at: string | null
  entregado_at: string | null
}

interface SeguimientoEnVivoProps {
  envioId: string
  estadoInicial: EstadoEnvio
}

// Seguimiento público: un solo canal de broadcast (no postgres_changes, el anon no
// lee la tabla), filtrado por el id del envío. Se desuscribe al desmontar.
export function SeguimientoEnVivo({ envioId, estadoInicial }: SeguimientoEnVivoProps) {
  const [estado, setEstado] = useState<EstadoEnvio>(estadoInicial)

  useEffect(() => {
    const supabase = createClient()
    const canal = supabase
      .channel(`envio:${envioId}`)
      .on('broadcast', { event: 'estado' }, ({ payload }) => setEstado(payload as EstadoEnvio))
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [envioId])

  if (estado.estado === 'cancelado') {
    return (
      <div className="mt-8 rounded-xl border border-[var(--orange)]/40 bg-[var(--orange)]/10 p-5 text-sm text-[var(--orange)]">
        Este pedido fue cancelado. Si tenés dudas, contactá a la mensajería.
      </div>
    )
  }

  const pasoActual = PASOS.findIndex((p) => p.estado === estado.estado)
  const horas: Record<string, string | null> = {
    asignado: estado.asignado_at,
    retirado: estado.retirado_at,
    entregado: estado.entregado_at,
  }

  return (
    <div className="mt-8 w-full rounded-xl border border-border bg-[var(--panel)] p-5">
      <ol className="grid gap-5">
        {PASOS.map((paso, i) => {
          const hecho = i <= pasoActual
          const esActual = i === pasoActual
          const hora = horas[paso.estado]
          return (
            <li key={paso.estado} className="flex items-center gap-3 text-left">
              <span
                className={`flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold ${
                  hecho
                    ? 'border-primary bg-primary/15 text-primary'
                    : 'border-border text-[var(--muted)]'
                } ${esActual ? 'shadow-[0_0_14px_var(--lime)]' : ''}`}
              >
                {i + 1}
              </span>
              <div>
                <p className={hecho ? 'font-semibold text-foreground' : 'text-[var(--muted)]'}>{paso.label}</p>
                {hora && <p className="text-xs text-[var(--muted)]">{formatHora(hora)}</p>}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
