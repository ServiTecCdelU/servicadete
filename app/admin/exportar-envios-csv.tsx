'use client'

import { Boton } from '@/components/app/ui'
import { formatHora, formatMonto } from '@/lib/format'

const ESTADO_LABEL: Record<string, string> = {
  solicitado: 'Solicitado',
  asignado: 'Asignado',
  retirado: 'En camino',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
}

export interface EnvioExportable {
  estado: string
  direccion_destino: string
  tarifa: number
  comision: number
  origen: string
  created_at: string
  cadetes: { nombre: string } | null
  comercios: { nombre: string } | null
}

function aCsv(filas: EnvioExportable[]): string {
  const encabezado = ['Hora', 'Estado', 'Comercio', 'Destino', 'Cadete', 'Tarifa', 'Comisión']
  const lineas = filas.map((f) => [
    formatHora(f.created_at),
    ESTADO_LABEL[f.estado] ?? f.estado,
    f.comercios?.nombre ?? (f.origen === 'particular' ? 'Pedido particular' : 'Sin comercio'),
    f.direccion_destino,
    f.cadetes?.nombre ?? '',
    formatMonto(f.tarifa),
    formatMonto(f.comision),
  ])
  return [encabezado, ...lineas]
    .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
}

export function ExportarEnviosCsv({ filas, etiquetaFecha }: { filas: EnvioExportable[]; etiquetaFecha: string }) {
  function descargar() {
    // BOM al inicio: que Excel abra los acentos bien (UTF-8 sin BOM los rompe).
    const blob = new Blob(['﻿' + aCsv(filas)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `pedidos_${etiquetaFecha}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Boton type="button" variante="secundario" onClick={descargar} disabled={filas.length === 0} className="h-10 px-4 text-sm">
      Exportar a Excel
    </Boton>
  )
}
