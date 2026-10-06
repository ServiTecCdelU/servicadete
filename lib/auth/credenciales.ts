import 'server-only'
import { randomInt } from 'node:crypto'

// Sin caracteres ambiguos (0/O, 1/l/I) para que se pueda dictar por teléfono.
const ALFABETO = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export function generarPassword(largo = 12): string {
  return Array.from({ length: largo }, () => ALFABETO[randomInt(ALFABETO.length)]).join('')
}

export function generarPin(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0')
}
