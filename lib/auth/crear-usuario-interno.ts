import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase/database.types'
import { emailInterno, usuarioBase, usuarioConSufijo } from './usuario-interno'
import { generarPin } from './credenciales'

const MAX_INTENTOS = 5

export type UsuarioInternoCreado = { userId: string; usuario: string; pin: string }

// Crea el auth.user de un cadete o comercio. Con email real: puede entrar con Google
// además de usuario+PIN (Supabase vincula la cuenta de Google al mismo user por el
// email). Sin email: usuario interno (nombre.slug @servicadete.local), solo PIN —
// no tiene bandeja real, así que Google no le sirve.
export async function crearUsuarioInterno(
  admin: SupabaseClient<Database>,
  nombre: string,
  slug: string,
  emailPersonalizado?: string,
): Promise<UsuarioInternoCreado> {
  const pin = generarPin()

  if (emailPersonalizado) {
    const email = emailPersonalizado.trim().toLowerCase()
    const { data, error } = await admin.auth.admin.createUser({
      email,
      password: pin,
      email_confirm: true,
      user_metadata: { nombre },
    })
    if (error || !data.user) {
      throw new Error(error?.code === 'email_exists' ? 'EMAIL_EXISTS' : (error?.message ?? 'No se pudo crear el usuario'))
    }
    return { userId: data.user.id, usuario: email, pin }
  }

  const base = usuarioBase(nombre, slug)
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

export async function obtenerEmailUsuario(admin: SupabaseClient<Database>, userId: string): Promise<string | null> {
  const { data, error } = await admin.auth.admin.getUserById(userId)
  if (error) return null
  return data.user.email ?? null
}

// Cambia el email de login de un usuario ya creado. Se confirma al instante (sin
// mandar mail de verificación): evita gastar la cuota de email del plan gratuito.
export async function cambiarEmailUsuario(
  admin: SupabaseClient<Database>,
  userId: string,
  email: string,
): Promise<void> {
  const { error } = await admin.auth.admin.updateUserById(userId, { email: email.trim().toLowerCase(), email_confirm: true })
  if (error) throw new Error(error.code === 'email_exists' ? 'EMAIL_EXISTS' : error.message)
}

// Cambia el PIN/contraseña de un usuario ya creado (cadete, comercio o admin).
// Si no se pasa pin, se genera uno nuevo al azar.
export async function cambiarCredencial(
  admin: SupabaseClient<Database>,
  userId: string,
  pinPersonalizado?: string,
): Promise<string> {
  const pin = pinPersonalizado ?? generarPin()
  const { error } = await admin.auth.admin.updateUserById(userId, { password: pin })
  if (error) throw new Error(error.message)
  return pin
}
