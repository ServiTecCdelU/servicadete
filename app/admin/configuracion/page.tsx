import { Etiqueta, Tarjeta } from '@/components/app/ui'
import { requireRol } from '@/lib/auth/perfil'
import { createClient } from '@/lib/supabase/server'
import { MensajeriaForm } from './mensajeria-form'
import { MiCuenta } from './mi-cuenta'

export default async function ConfiguracionPage() {
  const perfil = await requireRol('admin')
  const supabase = await createClient()

  const [{ data: mensajeria }, { data: claims }] = await Promise.all([
    supabase
      .from('mensajerias')
      .select('nombre, slug, comision_cadete, dia_inicio_semana, logo_url, eslogan')
      .eq('id', perfil.mensajeriaId as string)
      .single(),
    supabase.auth.getClaims(),
  ])

  return (
    <div className="grid gap-8">
      <header>
        <Etiqueta>CONFIGURACIÓN</Etiqueta>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">Ajustes</h1>
      </header>

      <Tarjeta>
        <Etiqueta>TU CUENTA</Etiqueta>
        <div className="mt-4">
          <MiCuenta emailActual={typeof claims?.claims.email === 'string' ? claims.claims.email : ''} />
        </div>
      </Tarjeta>

      {mensajeria && (
        <Tarjeta>
          <Etiqueta>MENSAJERÍA</Etiqueta>
          <div className="mt-4">
            <MensajeriaForm
              mensajeria={{
                nombre: mensajeria.nombre,
                slug: mensajeria.slug,
                comisionCadete: mensajeria.comision_cadete,
                diaInicioSemana: mensajeria.dia_inicio_semana,
                logoUrl: mensajeria.logo_url,
                eslogan: mensajeria.eslogan,
              }}
            />
          </div>
        </Tarjeta>
      )}
    </div>
  )
}
