import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SeguimientoEnVivo } from './seguimiento-en-vivo'

interface PageProps {
  params: Promise<{ slug: string; id: string }>
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const metadata: Metadata = { title: 'Seguimiento del envío', robots: { index: false, follow: false } }

export default async function SeguimientoPage({ params }: PageProps) {
  const { id } = await params
  if (!UUID_RE.test(id)) notFound()

  const supabase = await createClient()
  const { data: envio } = await supabase.rpc('seguimiento_envio', { p_id: id }).single()
  if (!envio) notFound()

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col items-center px-5 py-10 text-center">
        <span className="inline-block size-3 rounded-full bg-primary shadow-[0_0_18px_var(--lime)]" aria-hidden />
        <h1 className="mt-4 text-2xl font-bold tracking-tight">{envio.mensajeria_nombre}</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">Seguimiento de tu envío a {envio.direccion_destino}</p>

        <SeguimientoEnVivo
          envioId={id}
          estadoInicial={{
            estado: envio.estado,
            asignado_at: envio.asignado_at,
            retirado_at: envio.retirado_at,
            entregado_at: envio.entregado_at,
          }}
        />
      </div>
    </main>
  )
}
