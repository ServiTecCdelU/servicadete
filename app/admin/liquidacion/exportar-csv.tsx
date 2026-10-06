'use client'

import { Boton } from '@/components/app/ui'

interface Fila {
  nombre: string
  envios: number
  a_rendir: number
  rendido: number
  saldo: number
}

function aCsv(filas: Fila[]): string {
  const encabezado = ['Cadete', 'Envíos', 'Generado', 'Rendido', 'Saldo']
  const lineas = filas.map((f) => [f.nombre, f.envios, f.a_rendir, f.rendido, f.saldo])
  return [encabezado, ...lineas]
    .map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(','))
    .join('\r\n')
}

export function ExportarCsv({ filas, desde, hasta }: { filas: Fila[]; desde: string; hasta: string }) {
  function descargar() {
    // BOM al inicio: que Excel abra los acentos bien (UTF-8 sin BOM los rompe).
    const blob = new Blob(['﻿' + aCsv(filas)], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `liquidacion_${desde}_${hasta}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Boton type="button" variante="secundario" onClick={descargar} disabled={filas.length === 0}>
      Exportar a CSV
    </Boton>
  )
}
