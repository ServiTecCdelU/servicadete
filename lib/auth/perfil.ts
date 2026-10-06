import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { esRol, type Rol } from './roles'

export type PerfilActual = {
  userId: string
  rol: Rol
  nombre: string
  mensajeriaId: string | null
}

// Una lectura de perfil por request (cache de React deduplica entre layout y page).
export const getPerfilActual = cache(async (): Promise<PerfilActual | null> => {
  const supabase = await createClient()
  const { data: claims } = await supabase.auth.getClaims()
  const userId = claims?.claims.sub
  if (!userId) return null

  const { data, error } = await supabase
    .from('perfiles')
    .select('rol, nombre, mensajeria_id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[perfil] error leyendo perfil', { userId, code: error.code })
    return null
  }
  if (!data || !esRol(data.rol)) return null

  return { userId, rol: data.rol, nombre: data.nombre, mensajeriaId: data.mensajeria_id }
})

// Autorización real (el proxy solo hace un chequeo optimista de sesión).
export async function requireRol(rol: Rol): Promise<PerfilActual> {
  const perfil = await getPerfilActual()
  if (!perfil || perfil.rol !== rol) redirect('/login')
  return perfil
}
