// Primitivas de las pantallas internas: mismo lenguaje que la landing (dark, lima, HUD)
// pero simples, con objetivos táctiles grandes y casi sin animación.
import type { ComponentProps, ReactNode } from 'react'
import { cn } from '@/lib/utils'

type Variante = 'primario' | 'secundario' | 'peligro'

const VARIANTES: Record<Variante, string> = {
  primario:
    'bg-primary text-primary-foreground font-extrabold shadow-[0_0_28px_rgba(183,243,75,.14)] hover:shadow-[0_0_34px_rgba(183,243,75,.3)]',
  secundario: 'border border-border font-semibold hover:border-primary/50',
  peligro: 'border border-[var(--orange)]/40 font-semibold text-[var(--orange)] hover:bg-[var(--orange)]/10',
}

export function botonClass(variante: Variante = 'primario', className?: string): string {
  return cn(
    'inline-flex h-12 items-center justify-center gap-2 rounded-md px-5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-60',
    VARIANTES[variante],
    className,
  )
}

interface BotonProps extends ComponentProps<'button'> {
  variante?: Variante
}

export function Boton({ variante = 'primario', className, ...props }: BotonProps) {
  return <button className={botonClass(variante, className)} {...props} />
}

export const inputClass =
  'h-12 w-full rounded-md border border-border bg-[var(--panel-2)] px-3 text-base outline-none transition placeholder:text-[var(--muted)]/60 focus:border-primary focus:ring-2 focus:ring-primary/25 aria-invalid:border-[var(--orange)]'

interface CampoProps {
  label: string
  error?: string
  hint?: string
  children: ReactNode
}

export function Campo({ label, error, hint, children }: CampoProps) {
  return (
    <label className="grid gap-1.5 text-sm">
      <span>{label}</span>
      {children}
      {error ? (
        <span role="alert" className="text-xs text-[var(--orange)]">{error}</span>
      ) : hint ? (
        <span className="text-xs text-[var(--muted)]">{hint}</span>
      ) : null}
    </label>
  )
}

export function Tarjeta({ className, ...props }: ComponentProps<'section'>) {
  return (
    <section
      className={cn('rounded-xl border border-border bg-[var(--panel)] p-5 shadow-[0_18px_50px_rgba(0,0,0,.2)]', className)}
      {...props}
    />
  )
}

export function Etiqueta({ children }: { children: ReactNode }) {
  return <p className="text-[10px] font-extrabold tracking-[.2em] text-[var(--muted)]">{children}</p>
}

export function Aviso({ tono, children }: { tono: 'error' | 'ok'; children: ReactNode }) {
  return (
    <p
      role={tono === 'error' ? 'alert' : 'status'}
      className={cn(
        'rounded-md border p-3 text-sm',
        tono === 'error'
          ? 'border-[var(--orange)]/40 bg-[var(--orange)]/10 text-[var(--orange)]'
          : 'border-primary/40 bg-primary/10 text-primary',
      )}
    >
      {children}
    </p>
  )
}
