import { NextResponse, type NextRequest } from 'next/server'
import { withBasePath } from '@/lib/base-path'
import { createClient } from '@/lib/supabase/server'

// Destino del OAuth (Google): canjea el código por la sesión y vuelve a /login,
// que redirige según el rol.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')

  // En route handlers Next no prefija el basePath en redirects: se agrega a mano.
  const destino = new URL(withBasePath('/login'), request.nextUrl.origin)

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(destino)
    console.error('[auth/callback] no se pudo canjear el código', { status: error.status })
  }

  destino.searchParams.set('error', 'oauth')
  return NextResponse.redirect(destino)
}
