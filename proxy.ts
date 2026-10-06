import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rolRequerido } from '@/lib/auth/roles'
import { urlPublica } from '@/lib/site-url'
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from '@/lib/supabase/env'

// Refresca la sesión y hace un chequeo optimista: sin sesión no se entra a las áreas privadas.
// El rol se valida en el layout de cada área (requireRol), que lee el perfil una vez.
// getClaims verifica el JWT con las claves públicas (JWKS) sin consultar la base.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
      },
    },
  })

  const { data } = await supabase.auth.getClaims()
  const autenticado = Boolean(data?.claims.sub)

  if (!autenticado && rolRequerido(request.nextUrl.pathname)) {
    return NextResponse.redirect(urlPublica('/login', request.nextUrl.origin))
  }

  return response
}

export const config = {
  // La landing pública no necesita sesión: el proxy solo corre donde importa.
  matcher: ['/login', '/auth/:path*', '/superadmin/:path*', '/admin/:path*', '/cadete/:path*', '/comercio/:path*'],
}
