import { Etiqueta, Tarjeta } from '@/components/app/ui'
import { obtenerEmailUsuario } from '@/lib/auth/crear-usuario-interno'
import { esUsuarioInterno } from '@/lib/auth/usuario-interno'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { FilaComercio } from './fila-comercio'
import { NuevoComercio } from './nuevo-comercio'

export default async function ComerciosPage() {
  const supabase = await createClient()
  const [{ data: comerciosDb, error }, { data: cadetes }] = await Promise.all([
    supabase
      .from('comercios')
      .select('id, nombre, direccion, telefono, tarifa, activo, cadete_fijo_id, perfil_id')
      .order('activo', { ascending: false })
      .order('nombre'),
    supabase.from('cadetes').select('id, nombre').eq('activo', true).order('nombre'),
  ])

  // El email de login vive en auth.users, no en la tabla: se resuelve aparte (admin API).
  const admin = createAdminClient()
  const comercios = comerciosDb
    ? await Promise.all(
        comerciosDb.map(async (c) => {
          const raw = c.perfil_id ? await obtenerEmailUsuario(admin, c.perfil_id) : null
          const email = raw && !esUsuarioInterno(raw) ? raw : (raw?.split('@')[0] ?? null)
          return { ...c, email }
        }),
      )
    : null

  return (
    <div className="grid gap-8">
      <header>
        <Etiqueta>COMERCIOS</Etiqueta>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Comercios</h1>
        <p className="mt-1 text-sm text-[var(--muted)]">
          {comercios ? `${comercios.length} en total` : 'Cargando…'}
        </p>
      </header>

      <NuevoComercio />

      {error ? (
        <Tarjeta>
          <p className="text-sm text-[var(--orange)]">No pudimos cargar los comercios. Recargá la página.</p>
        </Tarjeta>
      ) : (comercios ?? []).length === 0 ? (
        <Tarjeta>
          <p className="text-sm text-[var(--muted)]">Todavía no hay comercios. Creá el primero arriba.</p>
        </Tarjeta>
      ) : (
        <ul className="grid gap-3">
          {(comercios ?? []).map((c) => (
            <li key={c.id}>
              <FilaComercio
                comercio={{
                  id: c.id,
                  nombre: c.nombre,
                  direccion: c.direccion,
                  telefono: c.telefono,
                  tarifa: c.tarifa,
                  activo: c.activo,
                  cadeteFijoId: c.cadete_fijo_id,
                  tieneAcceso: c.perfil_id !== null,
                  email: c.email,
                }}
                cadetes={cadetes ?? []}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
