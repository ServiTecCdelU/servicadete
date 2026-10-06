import type { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { salir } from '@/app/auth/actions'
import { getPerfilActual } from '@/lib/auth/perfil'
import { HOME_POR_ROL } from '@/lib/auth/roles'
import { createClient } from '@/lib/supabase/server'
import { LoginForm } from './login-form'

export const metadata: Metadata = {
  title: 'Ingresar',
  robots: { index: false, follow: false },
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const perfil = await getPerfilActual()
  if (perfil) redirect(HOME_POR_ROL[perfil.rol])

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  const email = typeof data?.claims.email === 'string' ? data.claims.email : null
  const { error } = await searchParams

  return (
    <main className="grid min-h-dvh place-items-center bg-background px-4 py-10 text-foreground">
      <div className="w-full max-w-sm">
        <Link href="/" className="mb-8 flex items-center justify-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="inline-block size-2.5 rounded-full bg-primary shadow-[0_0_18px_var(--lime)]" />
          ServiCadete
        </Link>

        <section className="rounded-xl border border-border bg-[var(--panel)] p-6 shadow-[0_24px_70px_rgba(0,0,0,.25)]">
          {data?.claims.sub ? (
            <SinAcceso email={email} />
          ) : (
            <>
              <h1 className="text-2xl font-bold tracking-tight">Ingresar</h1>
              <p className="mt-1 text-sm text-[var(--muted)]">Entrá con tu cuenta para ver tu operación.</p>
              {error === 'oauth' && (
                <p role="alert" className="mt-4 rounded-md border border-[var(--orange)]/40 bg-[var(--orange)]/10 p-3 text-sm text-[var(--orange)]">
                  No pudimos completar el ingreso con Google. Probá de nuevo.
                </p>
              )}
              <LoginForm />
            </>
          )}
        </section>
      </div>
    </main>
  )
}

function SinAcceso({ email }: { email: string | null }) {
  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Tu cuenta todavía no tiene acceso</h1>
      <p className="mt-2 text-sm text-[var(--muted)]">
        {email ? <>Entraste como <strong className="text-foreground">{email}</strong>. </> : null}
        Pedile al administrador de tu mensajería que te habilite.
      </p>
      <form action={salir} className="mt-6">
        <button className="h-12 w-full rounded-md border border-border font-semibold transition hover:border-primary/50">
          Salir
        </button>
      </form>
    </div>
  )
}
