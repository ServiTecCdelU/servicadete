import type { Metadata } from 'next'
import { AppHeader } from '@/components/app/app-header'
import { requireRol } from '@/lib/auth/perfil'

export const metadata: Metadata = {
  title: 'Cadete',
  robots: { index: false, follow: false },
}

export default async function CadeteLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requireRol('cadete')

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppHeader area="CADETE" nombre={perfil.nombre} />
      <main className="mx-auto max-w-xl px-4 py-6">{children}</main>
    </div>
  )
}
