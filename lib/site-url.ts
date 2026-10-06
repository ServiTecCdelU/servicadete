import { BASE_PATH } from './base-path'

// URL pública de la app, con basePath. En producción la app se sirve detrás del rewrite
// de servitec.net.ar, así que el host del request es el de vercel.app y no sirve para
// armar redirects absolutos. Local: http://localhost:3000/servicadete
// Producción (Vercel env): https://www.servitec.net.ar/servicadete
export function urlPublica(path: string, requestOrigin: string): URL {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? `${requestOrigin}${BASE_PATH}`
  return new URL(`${sinBarraFinal(base)}${path}`)
}

// Base pública con basePath (termina en "/") para metadataBase: Next resuelve contra ella
// las URLs relativas de metadata, incluida la de opengraph-image, que no lleva basePath.
export const SITE_URL = new URL(
  `${sinBarraFinal(process.env.NEXT_PUBLIC_SITE_URL ?? `http://localhost:3000${BASE_PATH}`)}/`,
)

function sinBarraFinal(url: string): string {
  return url.replace(/\/$/, '')
}
