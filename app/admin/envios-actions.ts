'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRol } from '@/lib/auth/perfil'
import { createClient } from '@/lib/supabase/server'

const nuevoEnvioSchema = z.object({
  comercioId: z.uuid().optional().or(z.literal('')),
  cadeteId: z.uuid().optional().or(z.literal('')),
  direccionDestino: z.string().trim().min(3, 'Mínimo 3 caracteres').max(160),
  nota: z.string().trim().max(300).optional().or(z.literal('')),
  // Lo que cobra el cadete por este envío en particular; la base valida que esté
  // entre 0 y la tarifa (la tarifa la fija el comercio, no se manda desde acá).
  comision: z.coerce.number().min(0).max(10_000_000),
})

export type NuevoEnvioState = { estado: 'inicial' } | { estado: 'error'; mensaje: string } | { estado: 'ok' }

export async function crearEnvioAdmin(_prev: NuevoEnvioState, formData: FormData): Promise<NuevoEnvioState> {
  await requireRol('admin')
  const parsed = nuevoEnvioSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { estado: 'error', mensaje: parsed.error.issues[0]?.message ?? 'Revisá los datos.' }

  const supabase = await createClient()
  const { error } = await supabase.from('envios').insert({
    comercio_id: parsed.data.comercioId || null,
    cadete_id: parsed.data.cadeteId || null,
    direccion_destino: parsed.data.direccionDestino,
    nota: parsed.data.nota || null,
    comision: parsed.data.comision,
    // mensajeria_id y origen los recalcula el trigger según el rol; estos valores son
    // placeholders solo para satisfacer el tipo (son uuid/enum válidos, no se usan).
    mensajeria_id: '00000000-0000-0000-0000-000000000000',
    origen: 'admin',
  })

  if (error) {
    const mensaje = error.code === '22023' ? 'La comisión debe estar entre 0 y la tarifa.' : 'No se pudo crear el envío.'
    console.error('[envios] alta desde admin', { code: error.code })
    return { estado: 'error', mensaje }
  }

  revalidatePath('/admin')
  return { estado: 'ok' }
}

const idSchema = z.object({ id: z.uuid() })

export async function confirmarEnvio(formData: FormData): Promise<void> {
  await requireRol('admin')
  const parsed = idSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return

  const supabase = await createClient()
  const { error } = await supabase.from('envios').update({ confirmado: true }).eq('id', parsed.data.id)
  if (error) console.error('[envios] confirmar', { code: error.code })
  revalidatePath('/admin')
}

export async function rechazarEnvio(formData: FormData): Promise<void> {
  await requireRol('admin')
  const parsed = idSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return

  const supabase = await createClient()
  const { error } = await supabase.from('envios').update({ estado: 'cancelado' }).eq('id', parsed.data.id)
  if (error) console.error('[envios] rechazar', { code: error.code })
  revalidatePath('/admin')
}

const asignarSchema = z.object({ id: z.uuid(), cadeteId: z.uuid() })

export async function asignarCadete(formData: FormData): Promise<void> {
  await requireRol('admin')
  const parsed = asignarSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return

  const supabase = await createClient()
  const { error } = await supabase
    .from('envios')
    .update({ cadete_id: parsed.data.cadeteId, estado: 'asignado' })
    .eq('id', parsed.data.id)
  if (error) console.error('[envios] asignar cadete', { code: error.code })
  revalidatePath('/admin')
}

export async function cancelarEnvio(formData: FormData): Promise<void> {
  await requireRol('admin')
  const parsed = idSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return

  const supabase = await createClient()
  const { error } = await supabase.from('envios').update({ estado: 'cancelado' }).eq('id', parsed.data.id)
  if (error) console.error('[envios] cancelar', { code: error.code })
  revalidatePath('/admin')
}
