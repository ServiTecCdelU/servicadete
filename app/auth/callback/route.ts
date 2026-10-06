import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Destino del OAuth (Google): canjea el código por la sesión y vuelve a /login,
// que redirige según el rol.
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}/login`)
    console.error('[auth/callback] no se pudo canjear el código', { status: error.status })
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`)
}
