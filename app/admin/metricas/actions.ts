'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { requireRol } from '@/lib/auth/perfil'
import { createClient } from '@/lib/supabase/server'

const gastoSchema = z.object({
  concepto: z.string().trim().min(2, 'Mínimo 2 caracteres').max(120),
  monto: z.coerce.number().positive('El monto debe ser mayor a 0').max(10_000_000),
  nota: z.string().trim().max(200).optional().or(z.literal('')),
})

export type GastoState = { estado: 'inicial' } | { estado: 'error'; mensaje: string } | { estado: 'ok' }

export async function registrarGasto(_prev: GastoState, formData: FormData): Promise<GastoState> {
  await requireRol('admin')
  const parsed = gastoSchema.safeParse(Object.fromEntries(formData))
  if (!parsed.success) return { estado: 'error', mensaje: parsed.error.issues[0]?.message ?? 'Revisá los datos.' }

  const supabase = await createClient()
  const { error } = await supabase.from('gastos').insert({
    concepto: parsed.data.concepto,
    monto: parsed.data.monto,
    nota: parsed.data.nota || null,
    // mensajeria_id, fecha_operativa y created_by los pone el trigger.
    mensajeria_id: '00000000-0000-0000-0000-000000000000',
  })

  if (error) {
    console.error('[metricas] registrar gasto', { code: error.code })
    return { estado: 'error', mensaje: 'No se pudo registrar el gasto.' }
  }

  revalidatePath('/admin/metricas')
  revalidatePath('/admin')
  return { estado: 'ok' }
}
