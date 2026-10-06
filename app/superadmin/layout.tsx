import { salir } from '@/app/auth/actions'
import { requireRol } from '@/lib/auth/perfil'

export default async function SuperadminLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requireRol('superadmin')

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <header className="sticky top-0 z-10 border-b border-border bg-[rgba(6,10,24,.85)] backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <span className="flex items-center gap-2 font-extrabold tracking-tight">
            <span className="inline-block size-2.5 rounded-full bg-primary shadow-[0_0_18px_var(--lime)]" />
            ServiCadete <span className="text-xs font-semibold tracking-[.16em] text-[var(--cyan)]">SUPERADMIN</span>
          </span>
          <form action={salir} className="flex items-center gap-3 text-sm">
            <span className="hidden text-[var(--muted)] sm:inline">{perfil.nombre}</span>
            <button className="h-10 rounded-md border border-border px-4 font-semibold transition hover:border-primary/50">
              Salir
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
