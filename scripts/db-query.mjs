// Ejecuta SQL contra el proyecto de Supabase vía Management API.
// Uso: node --env-file=.env.local scripts/db-query.mjs <archivo.sql | -e "select 1">
import { readFileSync } from 'node:fs'

const { SUPABASE_ACCESS_TOKEN: token, SUPABASE_PROJECT_REF: ref } = process.env
if (!token || !ref) {
  console.error('Faltan SUPABASE_ACCESS_TOKEN o SUPABASE_PROJECT_REF en .env.local')
  process.exit(1)
}

const [flag, value] = process.argv.slice(2)
const query = flag === '-e' ? value : readFileSync(flag, 'utf8')
if (!query) {
  console.error('Uso: db-query.mjs <archivo.sql> | -e "<sql>"')
  process.exit(1)
}

const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ query }),
})
const body = await res.text()
if (!res.ok) {
  console.error(`HTTP ${res.status}: ${body}`)
  process.exit(1)
}
console.log(body)
