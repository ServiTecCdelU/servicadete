// Genera los PNG de íconos a partir de public/icon.svg.
// Uso: node scripts/generar-iconos.mjs  (sharp viene como dependencia de next)
import { readFileSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.resolve('next/package.json'))
const sharp = require('sharp')

const svg = readFileSync('public/icon.svg', 'utf8')
// Maskable: fondo a sangre y contenido dentro de la zona segura (80% central).
const maskable = svg
  .replace('rx="112"', '')
  .replace(/(<path|<circle)/, '<g transform="translate(51.2 51.2) scale(.8)">$1')
  .replace('</svg>', '</g></svg>')

const salidas = [
  ['public/icon-32.png', svg, 32],
  ['public/apple-icon.png', svg.replace('rx="112"', ''), 180],
  ['public/icon-192.png', svg, 192],
  ['public/icon-512.png', svg, 512],
  ['public/icon-maskable-512.png', maskable, 512],
]

for (const [archivo, fuente, size] of salidas) {
  await sharp(Buffer.from(fuente), { density: 300 }).resize(size, size).png().toFile(archivo)
  console.log('ok', archivo)
}

for (const viejo of ['public/icon-light-32x32.png', 'public/icon-dark-32x32.png']) rmSync(viejo, { force: true })
