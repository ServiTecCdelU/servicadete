'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { cambiarCredencial, cambiarEmailUsuario, crearUsuarioInterno } from '@/lib/auth/crear-usuario-interno'
import { requireRol } from '@/lib/auth/perfil'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const nuevoComercioSchema = z.object({
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  direccion: z.string().trim().max(160).optional().or(z.literal('')),
  telefono: z.string().trim().max(30).optional().or(z.literal('')),
  tarifa: z.coerce.number().min(0).max(10_000_000),
})

type Campos = keyof z.infer<typeof nuevoComercioSchema>

export type NuevoComercioState =
  | { estado: 'inicial' }
  | { estado: 'error'; mensaje?: string; errores?: Partial<Record<Campos, string>> }
  | { estado: 'ok' }

export async function crearComercio(_prev: NuevoComercioState, formData: FormData): Promise<NuevoComercioState> {
  const perfil = await requireRol('admin')

  const parsed = nuevoComercioSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const errores: Partial<Record<Campos, string>> = {}
    for (const issue of parsed.error.issues) {
      const campo = issue.path[0] as Campos
      errores[campo] ??= issue.message
    }
    return { estado: 'error', errores }
  }
  const { nombre, direccion, telefono, tarifa } = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.from('comercios').insert({
    mensajeria_id: perfil.mensajeriaId as string,
    nombre,
    direccion: direccion || null,
    telefono: telefono || null,
    tarifa,
  })

  if (error) {
    console.error('[comercios] alta', { code: error.code })
    return { estado: 'error', mensaje: 'No se pudo crear el comercio.' }
  }

  revalidatePath('/admin/comercios')
  return { estado: 'ok' }
}

const idSchema = z.object({ id: z.uuid(), activo: z.enum(['true', 'false']).transform((v) => v === 'true') })

export async function cambiarEstadoComercio(formData: FormData): Promise<void> {
  const perfil = await requireRol('admin')
  const parsed = idSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return

  const supabase = await createClient()
  const { error } = await supabase
    .from('comercios')
    .update({ activo: parsed.data.activo })
    .eq('id', parsed.data.id)
    .eq('mensajeria_id', perfil.mensajeriaId as string)

  if (error) console.error('[comercios] cambio de estado', { code: error.code })
  revalidatePath('/admin/comercios')
}

const tarifaSchema = z.object({
  id: z.uuid(),
  tarifa: z.coerce.number().min(0).max(10_000_000),
  cadeteFijoId: z.uuid().optional().or(z.literal('')),
})

export async function actualizarComercio(formData: FormData): Promise<void> {
  const perfil = await requireRol('admin')
  const parsed = tarifaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return

  const supabase = await createClient()
  const { error } = await supabase
    .from('comercios')
    .update({ tarifa: parsed.data.tarifa, cadete_fijo_id: parsed.data.cadeteFijoId || null })
    .eq('id', parsed.data.id)
    .eq('mensajeria_id', perfil.mensajeriaId as string)

  if (error) console.error('[comercios] actualizar', { code: error.code })
  revalidatePath('/admin/comercios')
}

const editarDatosSchema = z.object({
  id: z.uuid(),
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  direccion: z.string().trim().max(160).optional().or(z.literal('')),
  telefono: z.string().trim().max(30).optional().or(z.literal('')),
})

export type EditarComercioState = { error: string | null }

export async function actualizarDatosComercio(_prev: EditarComercioState, formData: FormData): Promise<EditarComercioState> {
  const perfil = await requireRol('admin')
  const parsed = editarDatosSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisá los datos.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('comercios')
    .update({ nombre: parsed.data.nombre, direccion: parsed.data.direccion || null, telefono: parsed.data.telefono || null })
    .eq('id', parsed.data.id)
    .eq('mensajeria_id', perfil.mensajeriaId as string)

  if (error) {
    console.error('[comercios] editar datos', { code: error.code })
    return { error: 'No se pudo guardar.' }
  }
  revalidatePath('/admin/comercios')
  return { error: null }
}

const cambiarPinComercioSchema = z.object({
  comercioId: z.uuid(),
  pin: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^[0-9]{4,8}$/.test(v), 'El PIN va de 4 a 8 números'),
})

export type CambiarPinState = { estado: 'inicial' } | { estado: 'error'; mensaje: string } | { estado: 'ok'; pin: string }

export async function cambiarPinComercio(_prev: CambiarPinState, formData: FormData): Promise<CambiarPinState> {
  const perfil = await requireRol('admin')
  const parsed = cambiarPinComercioSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { estado: 'error', mensaje: parsed.error.issues[0]?.message ?? 'PIN inválido.' }

  const supabase = await createClient()
  const { data: comercio, error: errComercio } = await supabase
    .from('comercios')
    .select('perfil_id')
    .eq('id', parsed.data.comercioId)
    .eq('mensajeria_id', perfil.mensajeriaId as string)
    .single()
  if (errComercio || !comercio.perfil_id) return { estado: 'error', mensaje: 'Ese comercio todavía no tiene acceso.' }

  try {
    const admin = createAdminClient()
    const pin = await cambiarCredencial(admin, comercio.perfil_id, parsed.data.pin || undefined)
    return { estado: 'ok', pin }
  } catch (err) {
    console.error('[comercios] cambiar pin', err)
    return { estado: 'error', mensaje: 'No se pudo cambiar el PIN.' }
  }
}

const cambiarEmailComercioSchema = z.object({ comercioId: z.uuid(), email: z.email('Email inválido').trim().toLowerCase() })

export type CambiarEmailState = { estado: 'inicial' } | { estado: 'error'; mensaje: string } | { estado: 'ok'; email: string }

export async function cambiarEmailComercio(_prev: CambiarEmailState, formData: FormData): Promise<CambiarEmailState> {
  const perfil = await requireRol('admin')
  const parsed = cambiarEmailComercioSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { estado: 'error', mensaje: parsed.error.issues[0]?.message ?? 'Email inválido.' }

  const supabase = await createClient()
  const { data: comercio, error: errComercio } = await supabase
    .from('comercios')
    .select('perfil_id')
    .eq('id', parsed.data.comercioId)
    .eq('mensajeria_id', perfil.mensajeriaId as string)
    .single()
  if (errComercio || !comercio.perfil_id) return { estado: 'error', mensaje: 'Ese comercio todavía no tiene acceso.' }

  try {
    const admin = createAdminClient()
    await cambiarEmailUsuario(admin, comercio.perfil_id, parsed.data.email)
    revalidatePath('/admin/comercios')
    return { estado: 'ok', email: parsed.data.email }
  } catch (err) {
    const mensaje = err instanceof Error && err.message === 'EMAIL_EXISTS' ? 'Ese email ya tiene una cuenta.' : 'No se pudo cambiar el email.'
    console.error('[comercios] cambiar email', err)
    return { estado: 'error', mensaje }
  }
}

export type AccesoState =
  | { estado: 'inicial' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'ok'; usuario: string; pin: string }

const accesoSchema = z.object({
  comercioId: z.uuid(),
  nombre: z.string().trim().min(2).max(80),
  email: z.email('Email inválido').trim().toLowerCase().optional().or(z.literal('')),
})

export async function generarAccesoComercio(_prev: AccesoState, formData: FormData): Promise<AccesoState> {
  const perfil = await requireRol('admin')
  const parsed = accesoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { estado: 'error', mensaje: 'Datos inválidos.' }

  const supabase = await createClient()
  const { data: mensajeria, error: errMensajeria } = await supabase
    .from('mensajerias')
    .select('slug')
    .eq('id', perfil.mensajeriaId as string)
    .single()
  if (errMensajeria) return { estado: 'error', mensaje: 'No se pudo generar el acceso.' }

  const admin = createAdminClient()
  let creado
  try {
    creado = await crearUsuarioInterno(admin, parsed.data.nombre, mensajeria.slug, parsed.data.email || undefined)
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
      return { estado: 'error', mensaje: 'Ese email ya tiene una cuenta.' }
    }
    console.error('[comercios] alta de usuario', err)
    return { estado: 'error', mensaje: 'No se pudo generar el usuario.' }
  }

  const { error: errPerfil } = await admin.from('perfiles').insert({
    user_id: creado.userId,
    mensajeria_id: perfil.mensajeriaId as string,
    rol: 'comercio',
    nombre: parsed.data.nombre,
  })
  if (errPerfil) {
    await admin.auth.admin.deleteUser(creado.userId)
    console.error('[comercios] alta de perfil', { code: errPerfil.code })
    return { estado: 'error', mensaje: 'No se pudo crear el perfil.' }
  }

  const { error: errComercio } = await admin
    .from('comercios')
    .update({ perfil_id: creado.userId })
    .eq('id', parsed.data.comercioId)
    .eq('mensajeria_id', perfil.mensajeriaId as string)
  if (errComercio) {
    await admin.auth.admin.deleteUser(creado.userId)
    console.error('[comercios] vincular acceso', { code: errComercio.code })
    return { estado: 'error', mensaje: 'No se pudo vincular el acceso al comercio.' }
  }

  revalidatePath('/admin/comercios')
  return { estado: 'ok', usuario: creado.usuario, pin: creado.pin }
}
