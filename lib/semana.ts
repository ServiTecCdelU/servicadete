// Mismo cálculo que private.inicio_semana() en SQL, para armar los links de
// semana anterior/siguiente sin pedirle a la base más que los totales.
// Trabaja con fechas puras (YYYY-MM-DD) al mediodía UTC para no correrse de día.
function aFechaUTC(iso: string): Date {
  return new Date(`${iso}T12:00:00Z`)
}

function aISO(fecha: Date): string {
  return fecha.toISOString().slice(0, 10)
}

// ISO: 1 = lunes … 7 = domingo (igual que extract(isodow) en Postgres).
function isodow(fecha: Date): number {
  const dia = fecha.getUTCDay()
  return dia === 0 ? 7 : dia
}

export function inicioSemana(fechaIso: string, diaInicio: number): string {
  const fecha = aFechaUTC(fechaIso)
  const offset = (isodow(fecha) - diaInicio + 7) % 7
  fecha.setUTCDate(fecha.getUTCDate() - offset)
  return aISO(fecha)
}

export function sumarDias(fechaIso: string, dias: number): string {
  const fecha = aFechaUTC(fechaIso)
  fecha.setUTCDate(fecha.getUTCDate() + dias)
  return aISO(fecha)
}

export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}
