import type { MetadataRoute } from 'next'
import { withBasePath } from '@/lib/base-path'
import { SITE_DESCRIPTION, SITE_NAME, THEME_COLOR } from '@/lib/seo'

// PWA: el cadete la instala desde el celular. Arranca en /login, que redirige según el rol.
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: withBasePath('/'),
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    lang: 'es-AR',
    start_url: withBasePath('/login'),
    scope: withBasePath('/'),
    display: 'standalone',
    orientation: 'portrait',
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    categories: ['business', 'productivity'],
    icons: [
      { src: withBasePath('/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: withBasePath('/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: withBasePath('/icon-maskable-512.png'), sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
