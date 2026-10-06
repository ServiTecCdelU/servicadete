'use client'

import { useActionState } from 'react'
import { Aviso, Boton, Campo, inputClass } from '@/components/app/ui'
import { withBasePath } from '@/lib/base-path'
import { actualizarMensajeria, type MensajeriaState } from './actions'

interface MensajeriaFormProps {
  mensajeria: {
    nombre: string
    slug: string
    comisionCadete: number
    diaInicioSemana: number
    logoUrl: string | null
    eslogan: string | null
  }
}

const DIAS = [
  [1, 'Lunes'], [2, 'Martes'], [3, 'Miércoles'], [4, 'Jueves'], [5, 'Viernes'], [6, 'Sábado'], [7, 'Domingo'],
] as const

export function MensajeriaForm({ mensajeria }: MensajeriaFormProps) {
  const [state, formAction, pending] = useActionState<MensajeriaState, FormData>(actualizarMensajeria, { estado: 'inicial' })
  const errores = state.estado === 'error' ? (state.errores ?? {}) : {}

  return (
    <form action={formAction} className="grid gap-4 sm:grid-cols-2">
      <Campo label="Nombre" error={errores.nombre}>
        <input name="nombre" defaultValue={mensajeria.nombre} required maxLength={80} className={inputClass} />
      </Campo>
      <Campo label="Dirección pública" error={errores.slug} hint={`servitec.net.ar${withBasePath('/')}tu-slug`}>
        <input name="slug" defaultValue={mensajeria.slug} required maxLength={40} className={inputClass} />
      </Campo>
      <Campo label="Comisión del cadete por envío" error={errores.comisionCadete} hint="Default al crear un envío; el admin puede cambiarla envío por envío">
        <input name="comisionCadete" type="number" inputMode="decimal" min="0" step="1" defaultValue={mensajeria.comisionCadete} required className={inputClass} />
      </Campo>
      <Campo label="Inicio de la semana" error={errores.diaInicioSemana}>
        <select name="diaInicioSemana" defaultValue={mensajeria.diaInicioSemana} className={inputClass}>
          {DIAS.map(([v, nombre]) => (
            <option key={v} value={v}>{nombre}</option>
          ))}
        </select>
      </Campo>
      <div className="sm:col-span-2">
        <Campo label="Logo (URL, opcional)" error={errores.logoUrl}>
          <input name="logoUrl" type="url" defaultValue={mensajeria.logoUrl ?? ''} placeholder="https://…" maxLength={500} className={inputClass} />
        </Campo>
      </div>
      <div className="sm:col-span-2">
        <Campo
          label="Eslogan de tu página pública (opcional)"
          error={errores.eslogan}
          hint={`Se muestra en servitec.net.ar${withBasePath('/')}${mensajeria.slug}`}
        >
          <input name="eslogan" defaultValue={mensajeria.eslogan ?? ''} maxLength={140} placeholder="Tu pedido, en camino en minutos" className={inputClass} />
        </Campo>
      </div>

      {state.estado === 'error' && state.mensaje && (
        <div className="sm:col-span-2">
          <Aviso tono="error">{state.mensaje}</Aviso>
        </div>
      )}
      {state.estado === 'ok' && (
        <div className="sm:col-span-2">
          <Aviso tono="ok">Guardado.</Aviso>
        </div>
      )}

      <div className="sm:col-span-2">
        <Boton disabled={pending}>{pending ? 'Guardando…' : 'Guardar'}</Boton>
      </div>
    </form>
  )
}
