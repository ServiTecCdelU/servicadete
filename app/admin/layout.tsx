import type { Metadata } from 'next'
import { AdminNav } from '@/components/app/admin-nav'
import { AppHeader } from '@/components/app/app-header'
import { requireRol } from '@/lib/auth/perfil'

export const metadata: Metadata = {
  title: 'Panel',
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const perfil = await requireRol('admin')

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <AppHeader area="ADMIN" nombre={perfil.nombre} />
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <AdminNav />
      </div>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
