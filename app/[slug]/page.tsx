import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { HeroAnimado } from './hero-animado'
import { PedidoForm } from './pedido-form'

interface PageProps {
  params: Promise<{ slug: string }>
}

async function obtenerMensajeria(slug: string) {
  const supabase = await createClient()
  const { data } = await supabase.rpc('mensajeria_publica', { p_slug: slug }).single()
  return data
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const mensajeria = await obtenerMensajeria(slug)
  if (!mensajeria) return { title: 'Mensajería no encontrada' }

  return {
    title: mensajeria.nombre,
    description: mensajeria.eslogan ?? `Pedí tu envío con ${mensajeria.nombre}.`,
  }
}

export default async function MensajeriaPublicaPage({ params }: PageProps) {
  const { slug } = await params
  const mensajeria = await obtenerMensajeria(slug)
  if (!mensajeria) notFound()

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh max-w-md flex-col px-5 py-10">
        <header className="flex flex-col items-center text-center">
          {mensajeria.logo_url ? (
            <Image
              src={mensajeria.logo_url}
              alt={mensajeria.nombre}
              width={56}
              height={56}
              unoptimized
              className="size-14 rounded-xl object-cover"
            />
          ) : (
            <span className="inline-block size-3 rounded-full bg-primary shadow-[0_0_18px_var(--lime)]" aria-hidden />
          )}
          <h1 className="mt-4 text-3xl font-bold tracking-tight">{mensajeria.nombre}</h1>
          {mensajeria.eslogan && <p className="mt-2 text-[var(--muted)]">{mensajeria.eslogan}</p>}
        </header>

        <HeroAnimado />

        <section className="mt-2 rounded-xl border border-border bg-[var(--panel)] p-5 shadow-[0_18px_50px_rgba(0,0,0,.2)]">
          <div className="mb-4 flex items-center gap-2 text-xs font-bold tracking-[.14em] text-primary">
            <span className="inline-block size-1.5 rounded-full bg-primary shadow-[0_0_10px_var(--lime)]" />
            PEDÍ TU ENVÍO
          </div>
          <PedidoForm slug={slug} />
        </section>

        <footer className="mt-10 text-center text-xs text-[var(--muted)]">
          Hecho con{' '}
          <span className="font-bold text-primary">ServiCadete</span>
        </footer>
      </div>
    </main>
  )
}
