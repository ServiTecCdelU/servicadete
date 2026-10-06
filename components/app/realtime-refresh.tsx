'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface RealtimeRefreshProps {
  channelName: string
  table: string
  filterColumn: string
  filterValue: string
}

// Un solo canal por pantalla, filtrado por mensajeria_id (o cadete_id). Se desuscribe
// al desmontar y cuando la pestaña queda oculta; al volver, refresca una vez.
export function RealtimeRefresh({ channelName, table, filterColumn, filterValue }: RealtimeRefreshProps) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    let canal: ReturnType<typeof supabase.channel> | null = null

    function suscribir() {
      canal = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table, filter: `${filterColumn}=eq.${filterValue}` },
          () => router.refresh(),
        )
        .subscribe()
    }

    function alCambiarVisibilidad() {
      if (document.hidden) {
        if (canal) {
          supabase.removeChannel(canal)
          canal = null
        }
        return
      }
      if (!canal) {
        suscribir()
        router.refresh()
      }
    }

    suscribir()
    document.addEventListener('visibilitychange', alCambiarVisibilidad)
    return () => {
      document.removeEventListener('visibilitychange', alCambiarVisibilidad)
      if (canal) supabase.removeChannel(canal)
    }
  }, [channelName, table, filterColumn, filterValue, router])

  return null
}
