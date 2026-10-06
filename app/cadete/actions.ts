'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRol } from '@/lib/auth/perfil'
import { createClient } from '@/lib/supabase/server'

export type AccionState = { error: string | null }

const idSchema = z.object({ id: z.uuid() })

export async function tomarEnvio(_prev: AccionState, formData: FormData): Promise<AccionState> {
  await requireRol('cadete')
  const parsed = idSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Envío inválido.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('tomar_envio', { p_envio: parsed.data.id })
  if (error) return { error: 'Ese envío ya lo tomó otro cadete.' }

  revalidatePath('/cadete')
  return { error: null }
}

const coordsSchema = z.object({
  id: z.uuid(),
  lat: z.coerce.number().min(-90).max(90).optional().or(z.literal('')),
  lng: z.coerce.number().min(-180).max(180).optional().or(z.literal('')),
})

export async function marcarRetirado(_prev: AccionState, formData: FormData): Promise<AccionState> {
  await requireRol('cadete')
  const parsed = coordsSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Datos inválidos.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('envios')
    .update({
      estado: 'retirado',
      lat_retiro: parsed.data.lat || null,
      lng_retiro: parsed.data.lng || null,
    })
    .eq('id', parsed.data.id)

  if (error) {
    console.error('[cadete] marcar retirado', { code: error.code })
    return { error: 'No se pudo actualizar el envío.' }
  }
  revalidatePath('/cadete')
  return { error: null }
}

export async function marcarEntregado(_prev: AccionState, formData: FormData): Promise<AccionState> {
  await requireRol('cadete')
  const parsed = coordsSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Datos inválidos.' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('envios')
    .update({
      estado: 'entregado',
      lat_entrega: parsed.data.lat || null,
      lng_entrega: parsed.data.lng || null,
    })
    .eq('id', parsed.data.id)

  if (error) {
    console.error('[cadete] marcar entregado', { code: error.code })
    return { error: 'No se pudo actualizar el envío.' }
  }
  revalidatePath('/cadete')
  return { error: null }
}

const registroSchema = z.object({
  comercioId: z.uuid(),
  direccionDestino: z.string().trim().max(160).optional().or(z.literal('')),
  nota: z.string().trim().max(300).optional().or(z.literal('')),
})

export async function registrarEnvioCadete(_prev: AccionState, formData: FormData): Promise<AccionState> {
  await requireRol('cadete')
  const parsed = registroSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: 'Elegí el comercio.' }

  const supabase = await createClient()
  const { error } = await supabase.from('envios').insert({
    comercio_id: parsed.data.comercioId,
    direccion_destino: parsed.data.direccionDestino || 'A coordinar con el comercio',
    nota: parsed.data.nota || null,
    // mensajeria_id y origen los recalcula el trigger; placeholders para satisfacer el tipo.
    mensajeria_id: '00000000-0000-0000-0000-000000000000',
    origen: 'cadete',
  })

  if (error) {
    console.error('[cadete] registrar envío', { code: error.code })
    return { error: 'No se pudo registrar el envío.' }
  }
  revalidatePath('/cadete')
  return { error: null }
}
