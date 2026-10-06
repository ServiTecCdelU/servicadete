import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { withBasePath } from '@/lib/base-path'
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, THEME_COLOR } from '@/lib/seo'
import { SITE_URL } from '@/lib/site-url'
import './globals.css'

export const metadata: Metadata = {
  metadataBase: SITE_URL,
  title: { default: SITE_TITLE, template: `%s — ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    'mensajería',
    'cadetería',
    'software para mensajerías',
    'gestión de cadetes',
    'rendiciones',
    'envíos',
    'delivery',
    'ServiTec',
  ],
  authors: [{ name: 'ServiTec', url: 'https://servitec.net.ar' }],
  creator: 'ServiTec',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: '/',
  },
  twitter: { card: 'summary_large_image', title: SITE_TITLE, description: SITE_DESCRIPTION },
  icons: {
    icon: [
      { url: withBasePath('/icon.svg'), type: 'image/svg+xml' },
      { url: withBasePath('/icon-32.png'), sizes: '32x32', type: 'image/png' },
    ],
    apple: withBasePath('/apple-icon.png'),
  },
  appleWebApp: { capable: true, title: SITE_NAME, statusBarStyle: 'black-translucent' },
  formatDetection: { telephone: false },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: THEME_COLOR,
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  inLanguage: 'es-AR',
  url: SITE_URL.href,
  publisher: { '@type': 'Organization', name: 'ServiTec', url: 'https://servitec.net.ar' },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es-AR">
      <body className="antialiased">
        <script
          type="application/ld+json"
          // Contenido estático propio, sin datos de usuario.
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\u003c') }}
        />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
