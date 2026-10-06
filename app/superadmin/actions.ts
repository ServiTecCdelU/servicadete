'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRol } from '@/lib/auth/perfil'
import { cambiarCredencial } from '@/lib/auth/crear-usuario-interno'
import { generarPassword } from '@/lib/auth/credenciales'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { SLUG_RE, SLUGS_RESERVADOS } from '@/lib/validacion/slug'

const nuevaMensajeriaSchema = z.object({
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(SLUG_RE, 'Solo minúsculas, números y guiones (3 a 40)')
    .refine((s) => !SLUGS_RESERVADOS.has(s), 'Ese nombre está reservado'),
  adminNombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  adminEmail: z.string().trim().toLowerCase().email('Email inválido'),
})

type Campos = keyof z.infer<typeof nuevaMensajeriaSchema>

export type NuevaMensajeriaState =
  | { estado: 'inicial' }
  | { estado: 'error'; mensaje?: string; errores?: Partial<Record<Campos, string>> }
  | { estado: 'ok'; nombre: string; email: string; password: string }

export async function crearMensajeria(
  _prev: NuevaMensajeriaState,
  formData: FormData,
): Promise<NuevaMensajeriaState> {
  await requireRol('superadmin')

  const parsed = nuevaMensajeriaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const errores: Partial<Record<Campos, string>> = {}
    for (const issue of parsed.error.issues) {
      const campo = issue.path[0] as Campos
      errores[campo] ??= issue.message
    }
    return { estado: 'error', errores }
  }
  const { nombre, slug, adminNombre, adminEmail } = parsed.data

  // La mensajería se crea con la sesión del superadmin (RLS); el usuario admin, con la secret key.
  const supabase = await createClient()
  const { data: mensajeria, error: errMensajeria } = await supabase
    .from('mensajerias')
    .insert({ nombre, slug })
    .select('id')
    .single()

  if (errMensajeria) {
    if (errMensajeria.code === '23505') return { estado: 'error', errores: { slug: 'Ese slug ya está en uso' } }
    console.error('[superadmin] alta de mensajería', { code: errMensajeria.code })
    return { estado: 'error', mensaje: 'No se pudo crear la mensajería.' }
  }

  const admin = createAdminClient()
  const password = generarPassword()
  const { data: creado, error: errUsuario } = await admin.auth.admin.createUser({
    email: adminEmail,
    password,
    email_confirm: true,
    user_metadata: { nombre: adminNombre },
  })

  if (errUsuario || !creado.user) {
    await admin.from('mensajerias').delete().eq('id', mensajeria.id)
    if (errUsuario?.code === 'email_exists') {
      return { estado: 'error', errores: { adminEmail: 'Ese email ya tiene una cuenta' } }
    }
    console.error('[superadmin] alta de usuario admin', { code: errUsuario?.code })
    return { estado: 'error', mensaje: 'No se pudo crear el usuario administrador.' }
  }

  const { error: errPerfil } = await admin.from('perfiles').insert({
    user_id: creado.user.id,
    mensajeria_id: mensajeria.id,
    rol: 'admin',
    nombre: adminNombre,
  })

  if (errPerfil) {
    await admin.auth.admin.deleteUser(creado.user.id)
    await admin.from('mensajerias').delete().eq('id', mensajeria.id)
    console.error('[superadmin] alta de perfil admin', { code: errPerfil.code })
    return { estado: 'error', mensaje: 'No se pudo crear el perfil del administrador.' }
  }

  revalidatePath('/superadmin')
  return { estado: 'ok', nombre, email: adminEmail, password }
}

const cambiarEstadoSchema = z.object({
  id: z.uuid(),
  activa: z.enum(['true', 'false']).transform((v) => v === 'true'),
})

export async function cambiarEstadoMensajeria(formData: FormData): Promise<void> {
  await requireRol('superadmin')

  const parsed = cambiarEstadoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return

  const supabase = await createClient()
  const { error } = await supabase
    .from('mensajerias')
    .update({ activa: parsed.data.activa })
    .eq('id', parsed.data.id)

  if (error) console.error('[superadmin] cambio de estado', { code: error.code })
  revalidatePath('/superadmin')
}

const cambiarPasswordSchema = z.object({
  mensajeriaId: z.uuid(),
  password: z
    .string()
    .trim()
    .optional()
    .or(z.literal(''))
    .refine((v) => !v || v.length >= 8, 'Mínimo 8 caracteres'),
})

export type CambiarPasswordState =
  | { estado: 'inicial' }
  | { estado: 'error'; mensaje: string }
  | { estado: 'ok'; email: string; password: string }

export async function cambiarPasswordAdmin(
  _prev: CambiarPasswordState,
  formData: FormData,
): Promise<CambiarPasswordState> {
  await requireRol('superadmin')
  const parsed = cambiarPasswordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { estado: 'error', mensaje: parsed.error.issues[0]?.message ?? 'Datos inválidos.' }

  const admin = createAdminClient()
  const { data: perfilAdmin, error: errPerfil } = await admin
    .from('perfiles')
    .select('user_id')
    .eq('mensajeria_id', parsed.data.mensajeriaId)
    .eq('rol', 'admin')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()
  if (errPerfil || !perfilAdmin) return { estado: 'error', mensaje: 'Esa mensajería no tiene un admin todavía.' }

  const { data: usuario, error: errUsuario } = await admin.auth.admin.getUserById(perfilAdmin.user_id)
  if (errUsuario || !usuario.user.email) return { estado: 'error', mensaje: 'No se pudo encontrar al admin.' }

  try {
    const password = await cambiarCredencial(admin, perfilAdmin.user_id, parsed.data.password || generarPassword())
    return { estado: 'ok', email: usuario.user.email, password }
  } catch (err) {
    console.error('[superadmin] cambiar contraseña del admin', err)
    return { estado: 'error', mensaje: 'No se pudo cambiar la contraseña.' }
  }
}
