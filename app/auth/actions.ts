'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export type LoginState = { error: string | null }

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function loginConPassword(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '').trim().toLowerCase()
  const password = String(formData.get('password') ?? '')

  if (!EMAIL_RE.test(email) || password.length < 6) {
    return { error: 'Revisá el email y la contraseña.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: 'Email o contraseña incorrectos.' }

  redirect('/login')
}

export async function salir() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}
