'use server'

import { redirect } from 'next/navigation'
import { emailInterno } from '@/lib/auth/usuario-interno'
import { createClient } from '@/lib/supabase/server'

export type LoginState = { error: string | null }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
// El "usuario" de cadetes/comercios es nombre.slug (lo arma el admin al darlos de alta).
const USUARIO_RE = /^[a-z0-9-]{1,40}\.[a-z0-9-]{3,40}$/

export async function loginConPassword(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const identificador = String(formData.get('identificador') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  let email: string
  if (EMAIL_RE.test(identificador)) {
    email = identificador
  } else if (USUARIO_RE.test(identificador)) {
    email = emailInterno(identificador)
  } else {
    return { error: 'Revisá tu email o usuario.' }
  }
  if (password.length < 4) return { error: 'Revisá tu contraseña o PIN.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Datos incorrectos. Revisalos y probá de nuevo.' }

  redirect('/login')
}

export async function salir() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
