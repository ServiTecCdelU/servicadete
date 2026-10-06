'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { cambiarEmailUsuario } from '@/lib/auth/crear-usuario-interno'
import { requireRol } from '@/lib/auth/perfil'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { SLUG_RE, SLUGS_RESERVADOS } from '@/lib/validacion/slug'

const mensajeriaSchema = z.object({
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(SLUG_RE, 'Solo minúsculas, números y guiones (3 a 40)')
    .refine((s) => !SLUGS_RESERVADOS.has(s), 'Ese nombre está reservado'),
  comisionCadete: z.coerce.number().min(0).max(10_000_000),
  diaInicioSemana: z.coerce.number().int().min(1).max(7),
  logoUrl: z.url('URL inválida').trim().optional().or(z.literal('')),
})

type Campos = keyof z.infer<typeof mensajeriaSchema>

export type MensajeriaState = { estado: 'inicial' } | { estado: 'error'; mensaje?: string; errores?: Partial<Record<Campos, string>> } | { estado: 'ok' }

export async function actualizarMensajeria(_prev: MensajeriaState, formData: FormData): Promise<MensajeriaState> {
  const perfil = await requireRol('admin')
  const parsed = mensajeriaSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) {
    const errores: Partial<Record<Campos, string>> = {}
    for (const issue of parsed.error.issues) {
      const campo = issue.path[0] as Campos
      errores[campo] ??= issue.message
    }
    return { estado: 'error', errores }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('mensajerias')
    .update({
      nombre: parsed.data.nombre,
      slug: parsed.data.slug,
      comision_cadete: parsed.data.comisionCadete,
      dia_inicio_semana: parsed.data.diaInicioSemana,
      logo_url: parsed.data.logoUrl || null,
    })
    .eq('id', perfil.mensajeriaId as string)

  if (error) {
    if (error.code === '23505') return { estado: 'error', errores: { slug: 'Ese slug ya está en uso' } }
    console.error('[configuracion] actualizar mensajería', { code: error.code })
    return { estado: 'error', mensaje: 'No se pudo guardar.' }
  }

  revalidatePath('/admin/configuracion')
  return { estado: 'ok' }
}

const passwordSchema = z.object({
  password: z.string().trim().min(8, 'Mínimo 8 caracteres'),
})

export type MiPasswordState = { estado: 'inicial' } | { estado: 'error'; mensaje: string } | { estado: 'ok' }

// Autoservicio: cambia la contraseña de quien está logueado. No hace falta la
// secret key ni la contraseña anterior; Supabase ya validó la sesión actual.
export async function cambiarMiPassword(_prev: MiPasswordState, formData: FormData): Promise<MiPasswordState> {
  await requireRol('admin')
  const parsed = passwordSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { estado: 'error', mensaje: parsed.error.issues[0]?.message ?? 'Contraseña inválida.' }

  const supabase = await createClient()
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) {
    console.error('[configuracion] cambiar mi contraseña', error)
    return { estado: 'error', mensaje: 'No se pudo cambiar la contraseña.' }
  }
  return { estado: 'ok' }
}

const emailSchema = z.object({ email: z.email('Email inválido').trim().toLowerCase() })

export type MiEmailState = { estado: 'inicial' } | { estado: 'error'; mensaje: string } | { estado: 'ok'; email: string }

// Server-side con la propia sesión + la secret key solo para confirmar el email al
// instante (sin el mail de verificación de Supabase: evita gastar la cuota gratuita).
export async function cambiarMiEmail(_prev: MiEmailState, formData: FormData): Promise<MiEmailState> {
  const perfil = await requireRol('admin')
  const parsed = emailSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { estado: 'error', mensaje: parsed.error.issues[0]?.message ?? 'Email inválido.' }

  try {
    await cambiarEmailUsuario(createAdminClient(), perfil.userId, parsed.data.email)
    return { estado: 'ok', email: parsed.data.email }
  } catch (err) {
    const mensaje = err instanceof Error && err.message === 'EMAIL_EXISTS' ? 'Ese email ya tiene una cuenta.' : 'No se pudo cambiar el email.'
    console.error('[configuracion] cambiar mi email', err)
    return { estado: 'error', mensaje }
  }
}
