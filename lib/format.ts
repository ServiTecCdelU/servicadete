const moneda = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 })
const hora = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Argentina/Buenos_Aires' })

export function formatMonto(n: number): string {
  return moneda.format(n)
}

export function formatHora(iso: string): string {
  return hora.format(new Date(iso))
}
