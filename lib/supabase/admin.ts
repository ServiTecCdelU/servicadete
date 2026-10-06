import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL } from './env'

// Cliente con la secret key: saltea RLS. Usar solo en server actions puntuales
// (alta de usuarios con PIN, operaciones del superadmin).
export function createAdminClient() {
  const secretKey = process.env.SUPABASE_SECRET_KEY
  if (!secretKey) throw new Error('Falta la variable de entorno SUPABASE_SECRET_KEY')

  return createClient(SUPABASE_URL, secretKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}
