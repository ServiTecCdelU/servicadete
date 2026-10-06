import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'

// Se sirve en /servicadete/sitemap.xml. Los buscadores solo leen el robots.txt de la raíz
// del dominio, así que este sitemap hay que declararlo desde el proyecto de ServiTec.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: SITE_URL.href, changeFrequency: 'monthly', priority: 1 }]
}
