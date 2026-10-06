function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`Falta la variable de entorno ${name}`)
  return value
}

// Acceso literal a process.env para que Next las inyecte en el bundle del cliente.
export const SUPABASE_URL = requireEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL)
export const SUPABASE_PUBLISHABLE_KEY = requireEnv(
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
)
