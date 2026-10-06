import type { Metadata } from 'next'
import { AppHeader } from '@/components/app/app-header'
import { requireRol } from '@/lib/auth/perfil'

export const metadata: Metadata = {
  title: 'Comercio',
  robots: { index: false, follow: false },
}

export default async function ComercioLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requireRol('comercio')

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppHeader area="COMERCIO" nombre={perfil.nombre} />
      <main className="mx-auto max-w-xl px-4 py-8">{children}</main>
    </div>
  )
}
