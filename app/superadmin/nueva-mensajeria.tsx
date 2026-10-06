'use client'

import { useActionState, useState } from 'react'
import { Aviso, Boton, Campo, Etiqueta, inputClass, Tarjeta } from '@/components/app/ui'
import { crearMensajeria, type NuevaMensajeriaState } from './actions'

function aSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

export function NuevaMensajeria() {
  const [abierto, setAbierto] = useState(false)
  const [nombre, setNombre] = useState('')
  const [slug, setSlug] = useState('')
  const [slugEditado, setSlugEditado] = useState(false)

  const [state, formAction, pending] = useActionState<NuevaMensajeriaState, FormData>(
    async (prev, formData) => {
      const resultado = await crearMensajeria(prev, formData)
      // Solo si salió bien: se cierra y se limpia para mostrar las credenciales.
      if (resultado.estado === 'ok') {
        setAbierto(false)
        setNombre('')
        setSlug('')
        setSlugEditado(false)
      }
      return resultado
    },
    { estado: 'inicial' },
  )

  const errores = state.estado === 'error' ? state.errores ?? {} : {}

  if (!abierto) {
    return (
      <div className="grid gap-3">
        {state.estado === 'ok' && <Credenciales {...state} />}
        <Boton onClick={() => setAbierto(true)} className="w-full sm:w-auto sm:justify-self-start">
          + Nueva mensajería
        </Boton>
      </div>
    )
  }

  return (
    <Tarjeta>
      <Etiqueta>NUEVA MENSAJERÍA</Etiqueta>
      <form action={formAction} className="mt-4 grid gap-4 sm:grid-cols-2">
        <Campo label="Nombre de la mensajería" error={errores.nombre}>
          <input
            name="nombre"
            required
            maxLength={80}
            value={nombre}
            onChange={(e) => {
              setNombre(e.target.value)
              if (!slugEditado) setSlug(aSlug(e.target.value))
            }}
            aria-invalid={Boolean(errores.nombre)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Dirección pública" error={errores.slug} hint={`servitec.net.ar/servicadete/${slug || 'mi-mensajeria'}`}>
          <input
            name="slug"
            required
            maxLength={40}
            value={slug}
            onChange={(e) => {
              setSlugEditado(true)
              setSlug(aSlug(e.target.value))
            }}
            aria-invalid={Boolean(errores.slug)}
            className={inputClass}
          />
        </Campo>
        <Campo label="Nombre del administrador" error={errores.adminNombre}>
          <input name="adminNombre" required maxLength={80} aria-invalid={Boolean(errores.adminNombre)} className={inputClass} />
        </Campo>
        <Campo
          label="Email del administrador"
          error={errores.adminEmail}
          hint="Puede entrar con Google si es una cuenta de Gmail"
        >
          <input name="adminEmail" type="email" required aria-invalid={Boolean(errores.adminEmail)} className={inputClass} />
        </Campo>

        {state.estado === 'error' && state.mensaje && (
          <div className="sm:col-span-2">
            <Aviso tono="error">{state.mensaje}</Aviso>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:col-span-2 sm:flex-row sm:justify-end">
          <Boton type="button" variante="secundario" onClick={() => setAbierto(false)}>
            Cancelar
          </Boton>
          <Boton disabled={pending}>{pending ? 'Creando…' : 'Crear mensajería'}</Boton>
        </div>
      </form>
    </Tarjeta>
  )
}

function Credenciales({ nombre, email, password }: { nombre: string; email: string; password: string }) {
  return (
    <Tarjeta className="border-primary/40">
      <Etiqueta>LISTO · {nombre.toUpperCase()}</Etiqueta>
      <p className="mt-2 text-sm text-[var(--muted)]">
        Pasale estos datos al administrador. La contraseña <strong className="text-foreground">no se vuelve a mostrar</strong>.
      </p>
      <dl className="mt-4 grid gap-2 font-mono text-sm sm:grid-cols-[auto_1fr] sm:gap-x-4">
        <dt className="text-[var(--muted)]">Email</dt>
        <dd className="select-all break-all">{email}</dd>
        <dt className="text-[var(--muted)]">Contraseña</dt>
        <dd className="select-all text-lg font-bold text-primary">{password}</dd>
      </dl>
    </Tarjeta>
  )
}
