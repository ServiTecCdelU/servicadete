'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRol } from '@/lib/auth/perfil'
import { createClient } from '@/lib/supabase/server'

const pedidoSchema = z.object({
  direccionDestino: z.string().trim().min(3, 'Mínimo 3 caracteres').max(160),
  nota: z.string().trim().max(300).optional().or(z.literal('')),
})

export type PedirCadeteState = { estado: 'inicial' } | { estado: 'error'; mensaje: string } | { estado: 'ok' }

export async function pedirCadete(_prev: PedirCadeteState, formData: FormData): Promise<PedirCadeteState> {
  await requireRol('comercio')
  const parsed = pedidoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { estado: 'error', mensaje: parsed.error.issues[0]?.message ?? 'Revisá los datos.' }

  const supabase = await createClient()
  // El trigger completa comercio_id, tarifa, origen y estado según el rol (private.mi_comercio_id()).
  const { error } = await supabase.from('envios').insert({
    direccion_destino: parsed.data.direccionDestino,
    nota: parsed.data.nota || null,
    mensajeria_id: '00000000-0000-0000-0000-000000000000',
    origen: 'comercio',
  })

  if (error) {
    console.error('[comercio] pedir cadete', { code: error.code })
    return { estado: 'error', mensaje: 'No se pudo pedir el cadete.' }
  }

  revalidatePath('/comercio')
  return { estado: 'ok' }
}

const idSchema = z.object({ id: z.uuid() })

export async function confirmarEnvioCadete(formData: FormData): Promise<void> {
  await requireRol('comercio')
  const parsed = idSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return

  const supabase = await createClient()
  const { error } = await supabase.from('envios').update({ confirmado: true }).eq('id', parsed.data.id)
  if (error) console.error('[comercio] confirmar envío de cadete', { code: error.code })
  revalidatePath('/comercio')
}

export async function rechazarEnvioCadete(formData: FormData): Promise<void> {
  await requireRol('comercio')
  const parsed = idSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return

  const supabase = await createClient()
  const { error } = await supabase.from('envios').update({ estado: 'cancelado' }).eq('id', parsed.data.id)
  if (error) console.error('[comercio] rechazar envío de cadete', { code: error.code })
  revalidatePath('/comercio')
}
