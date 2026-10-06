import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { emailInterno, usuarioBase, usuarioConSufijo } from './usuario-interno'
import { generarPin } from './credenciales'

const MAX_INTENTOS = 5

export type UsuarioInternoCreado = { userId: string; usuario: string; pin: string }

// Crea el auth.user con usuario+PIN. Reintenta con sufijo si el email ya existe
// (nombre repetido en otra mensajería: el "usuario" es global aunque el admin no lo vea).
export async function crearUsuarioInterno(
  admin: SupabaseClient<Database>,
  nombre: string,
  slug: string,
): Promise<UsuarioInternoCreado> {
  const base = usuarioBase(nombre, slug)
  const pin = generarPin()

  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    const usuario = usuarioConSufijo(base, intento)
    const { data, error } = await admin.auth.admin.createUser({
      email: emailInterno(usuario),
      password: pin,
      email_confirm: true,
      user_metadata: { nombre, usuario },
    })

    if (!error && data.user) return { userId: data.user.id, usuario, pin }
    if (error?.code !== 'email_exists') {
      throw new Error(error?.message ?? 'No se pudo crear el usuario')
    }
  }
  throw new Error('No se pudo generar un usuario único, probá con otro nombre')
}
