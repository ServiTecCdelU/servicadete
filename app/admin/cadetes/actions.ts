'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { cambiarCredencial, crearUsuarioInterno } from '@/lib/auth/crear-usuario-interno'
import { requireRol } from '@/lib/auth/perfil'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const nuevoCadeteSchema = z.object({
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  telefono: z.string().trim().max(30).optional().or(z.literal('')),
  dni: z
    .string()
    .trim()
    .max(9)
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^[0-9]{6,9}$/.test(v), 'DNI inválido'),
  // Opcional: con un email real, el cadete también puede entrar con Google
  // (Supabase vincula esa cuenta a este mismo usuario). Sin email, solo usuario+PIN.
  email: z.email('Email inválido').trim().toLowerCase().optional().or(z.literal('')),
})

type Campos = keyof z.infer<typeof nuevoCadeteSchema>

export type NuevoCadeteState =
  | { estado: 'inicial' }
  | { estado: 'error'; mensaje?: string; errores?: Partial<Record<Campos, string>> }
  | { estado: 'ok'; nombre: string; usuario: string; pin: string }

export async function crearCadete(_prev: NuevoCadeteState, formData: FormData): Promise<NuevoCadeteState> {
  const perfil = await requireRol('admin')

  const parsed = nuevoCadeteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const errores: Partial<Record<Campos, string>> = {}
    for (const issue of parsed.error.issues) {
      const campo = issue.path[0] as Campos
      errores[campo] ??= issue.message
    }
    return { estado: 'error', errores }
  }
  const { nombre, telefono, dni, email } = parsed.data

  const supabase = await createClient()
  const { data: mensajeria, error: errMensajeria } = await supabase
    .from('mensajerias')
    .select('slug')
    .eq('id', perfil.mensajeriaId as string)
    .single()
  if (errMensajeria) {
    console.error('[cadetes] leer slug de la mensajería', { code: errMensajeria.code })
    return { estado: 'error', mensaje: 'No se pudo crear el cadete.' }
  }

  const admin = createAdminClient()
  let creado
  try {
    creado = await crearUsuarioInterno(admin, nombre, mensajeria.slug, email || undefined)
  } catch (err) {
    if (err instanceof Error && err.message === 'EMAIL_EXISTS') {
      return { estado: 'error', errores: { email: 'Ese email ya tiene una cuenta' } }
    }
    console.error('[cadetes] alta de usuario', err)
    return { estado: 'error', mensaje: 'No se pudo generar el usuario del cadete.' }
  }

  const { error: errPerfil } = await admin.from('perfiles').insert({
    user_id: creado.userId,
    mensajeria_id: perfil.mensajeriaId as string,
    rol: 'cadete',
    nombre,
  })
  if (errPerfil) {
    await admin.auth.admin.deleteUser(creado.userId)
    console.error('[cadetes] alta de perfil', { code: errPerfil.code })
    return { estado: 'error', mensaje: 'No se pudo crear el perfil del cadete.' }
  }

  const { error: errCadete } = await admin.from('cadetes').insert({
    mensajeria_id: perfil.mensajeriaId as string,
    perfil_id: creado.userId,
    nombre,
    telefono: telefono || null,
    dni: dni || null,
  })
  if (errCadete) {
    await admin.auth.admin.deleteUser(creado.userId)
    const mensaje = errCadete.code === '23505' ? 'Ya hay un cadete con ese DNI.' : 'No se pudo crear el cadete.'
    console.error('[cadetes] alta de cadete', { code: errCadete.code })
    return { estado: 'error', mensaje }
  }

  revalidatePath('/admin/cadetes')
  return { estado: 'ok', nombre, usuario: creado.usuario, pin: creado.pin }
}

const idSchema = z.object({ id: z.uuid(), activo: z.enum(['true', 'false']).transform((v) => v === 'true') })

export async function cambiarEstadoCadete(formData: FormData): Promise<void> {
  const perfil = await requireRol('admin')
  const parsed = idSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return

  const supabase = await createClient()
  const { error } = await supabase
    .from('cadetes')
    .update({ activo: parsed.data.activo })
    .eq('id', parsed.data.id)
    .eq('mensajeria_id', perfil.mensajeriaId as string)

  if (error) console.error('[cadetes] cambio de estado', { code: error.code })
  revalidatePath('/admin/cadetes')
}

const editarCadeteSchema = z.object({
  id: z.uuid(),
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  telefono: z.string().trim().max(30).optional().or(z.literal('')),
  dni: z
    .string()
    .trim()
    .max(9)
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^[0-9]{6,9}$/.test(v), 'DNI inválido'),
})

export type EditarCadeteState = { error: string | null }

export async function actualizarCadete(_prev: EditarCadeteState, formData: FormData): Promise<EditarCadeteState> {
  const perfil = await requireRol('admin')
  const parsed = editarCadeteSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisá los datos.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('cadetes')
    .update({ nombre: parsed.data.nombre, telefono: parsed.data.telefono || null, dni: parsed.data.dni || null })
    .eq('id', parsed.data.id)
    .eq('mensajeria_id', perfil.mensajeriaId as string)

  if (error) {
    console.error('[cadetes] editar', { code: error.code })
    return { error: error.code === '23505' ? 'Ya hay un cadete con ese DNI.' : 'No se pudo guardar.' }
  }
  revalidatePath('/admin/cadetes')
  return { error: null }
}

const cambiarPinSchema = z.object({
  cadeteId: z.uuid(),
  pin: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || /^[0-9]{4,8}$/.test(v), 'El PIN va de 4 a 8 números'),
})

export type CambiarPinState = { estado: 'inicial' } | { estado: 'error'; mensaje: string } | { estado: 'ok'; pin: string }

export async function cambiarPinCadete(_prev: CambiarPinState, formData: FormData): Promise<CambiarPinState> {
  const perfil = await requireRol('admin')
  const parsed = cambiarPinSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { estado: 'error', mensaje: parsed.error.issues[0]?.message ?? 'PIN inválido.' }

  const supabase = await createClient()
  const { data: cadete, error: errCadete } = await supabase
    .from('cadetes')
    .select('perfil_id')
    .eq('id', parsed.data.cadeteId)
    .eq('mensajeria_id', perfil.mensajeriaId as string)
    .single()
  if (errCadete || !cadete.perfil_id) return { estado: 'error', mensaje: 'Ese cadete no tiene usuario.' }

  try {
    const admin = createAdminClient()
    const pin = await cambiarCredencial(admin, cadete.perfil_id, parsed.data.pin || undefined)
    return { estado: 'ok', pin }
  } catch (err) {
    console.error('[cadetes] cambiar pin', err)
    return { estado: 'error', mensaje: 'No se pudo cambiar el PIN.' }
  }
}

const rendicionSchema = z.object({
  cadeteId: z.uuid(),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0').max(10_000_000),
  nota: z.string().trim().max(200).optional().or(z.literal('')),
})

export type RendicionState = { error: string | null }

export async function registrarRendicion(_prev: RendicionState, formData: FormData): Promise<RendicionState> {
  await requireRol('admin')
  const parsed = rendicionSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisá los datos.' }

  const supabase = await createClient()
  const { error } = await supabase.from('movimientos').insert({
    cadete_id: parsed.data.cadeteId,
    tipo: 'rendicion',
    monto: parsed.data.monto,
    nota: parsed.data.nota || null,
    // mensajeria_id lo pone el trigger; placeholder solo para satisfacer el tipo.
    mensajeria_id: '00000000-0000-0000-0000-000000000000',
  })

  if (error) {
    console.error('[cadetes] registrar rendición', { code: error.code })
    return { error: 'No se pudo registrar la rendición.' }
  }

  revalidatePath('/admin/cadetes')
  return { error: null }
}
