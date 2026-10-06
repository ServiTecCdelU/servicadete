import { NextResponse, type NextRequest } from 'next/server'
import { urlPublica } from '@/lib/site-url'
import { createClient } from '@/lib/supabase/server'

// Destino del OAuth (Google): canjea el código por la sesión y vuelve a /login,
// que redirige según el rol.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  // URL pública (no la del host interno de Vercel) y con basePath.
  const destino = urlPublica('/login', request.nextUrl.origin)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(destino)
    console.error('[auth/callback] no se pudo canjear el código', { status: error.status })
  }

  destino.searchParams.set('error', 'oauth')
  return NextResponse.redirect(destino)
}
