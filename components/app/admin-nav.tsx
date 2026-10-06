'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { withBasePath } from '@/lib/base-path'
import { cn } from '@/lib/utils'

const ITEMS = [
  { href: '/admin', label: 'Hoy' },
  { href: '/admin/cadetes', label: 'Cadetes' },
  { href: '/admin/comercios', label: 'Comercios' },
  { href: '/admin/liquidacion', label: 'Liquidación' },
  { href: '/admin/metricas', label: 'Dashboard' },
  { href: '/admin/configuracion', label: 'Configuración' },
]

export function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="-mx-4 flex gap-1 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0">
      {ITEMS.map((item) => {
        const href = withBasePath(item.href)
        const activo = item.href === '/admin' ? pathname === href : pathname.startsWith(href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition',
              activo ? 'border-primary text-foreground' : 'border-transparent text-[var(--muted)] hover:text-foreground',
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
