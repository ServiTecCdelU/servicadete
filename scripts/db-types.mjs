// Genera lib/supabase/database.types.ts desde el esquema real (Management API).
// Uso: pnpm db:types
import { writeFileSync } from 'node:fs'

const { SUPABASE_ACCESS_TOKEN: token, SUPABASE_PROJECT_REF: ref } = process.env
if (!token || !ref) {
  console.error('Faltan SUPABASE_ACCESS_TOKEN o SUPABASE_PROJECT_REF en .env.local')
  process.exit(1)
}

const res = await fetch(
  `https://api.supabase.com/v1/projects/${ref}/types/typescript?included_schemas=public`,
  { headers: { Authorization: `Bearer ${token}` } },
)
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${await res.text()}`)
  process.exit(1)
}
const { types } = await res.json()
writeFileSync('lib/supabase/database.types.ts', types)
console.log('ok lib/supabase/database.types.ts')
