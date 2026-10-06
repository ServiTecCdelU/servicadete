'use server'

import { redirect } from 'next/navigation'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'

const pedidoSchema = z.object({
  slug: z.string().trim().toLowerCase(),
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(80),
  telefono: z.string().trim().min(6, 'Teléfono inválido').max(30),
  direccionOrigen: z.string().trim().min(3, 'Mínimo 3 caracteres').max(160),
  direccionDestino: z.string().trim().min(3, 'Mínimo 3 caracteres').max(160),
  nota: z.string().trim().max(300).optional().or(z.literal('')),
  // Honeypot: un humano nunca completa este campo (queda oculto por CSS).
  web: z.string().optional().or(z.literal('')),
})

export type PedidoPublicoState = { error: string | null }

export async function crearPedidoPublico(_prev: PedidoPublicoState, formData: FormData): Promise<PedidoPublicoState> {
  const parsed = pedidoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Revisá los datos.' }

  const supabase = await createClient()
  const { data: id, error } = await supabase.rpc('crear_envio_publico', {
    p_slug: parsed.data.slug,
    p_nombre: parsed.data.nombre,
    p_telefono: parsed.data.telefono,
    p_origen: parsed.data.direccionOrigen,
    p_destino: parsed.data.direccionDestino,
    p_nota: parsed.data.nota || undefined,
    p_web: parsed.data.web || undefined,
  })

  if (error || !id) {
    const mensaje = error?.code === 'P0001' ? error.message : 'No pudimos registrar tu pedido. Probá de nuevo en un rato.'
    if (error?.code !== 'P0001') console.error('[pedido-publico] crear', { code: error?.code })
    return { error: mensaje }
  }

  // Next ya agrega el basePath a redirect() con una ruta relativa (igual que <Link>).
  redirect(`/${parsed.data.slug}/envio/${id}`)
}
